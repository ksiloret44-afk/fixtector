import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getMainPrisma, getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import QuoteDetails from '@/components/QuoteDetails'

export default async function ClientQuoteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any
  if (user.role !== 'client') {
    redirect('/')
  }

  // Récupérer l'entreprise de l'utilisateur
  const mainPrisma = getMainPrisma()
  const dbUser = await mainPrisma.user.findUnique({
    where: { id: user.id },
    select: { companyId: true },
  })

  if (!dbUser?.companyId) {
    notFound()
  }

  // Récupérer le client depuis la base de données de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    notFound()
  }

  // Trouver le customer par email de l'utilisateur
  const customer = await companyPrisma.customer.findFirst({
    where: { email: user.email },
  })

  if (!customer) {
    notFound()
  }

  const quote = await companyPrisma.quote.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      repair: {
        include: {
          customer: true,
        },
      },
    },
  })

  if (!quote || quote.customerId !== customer.id) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <QuoteDetails quote={quote} isClient={true} />
        </div>
      </main>
    </div>
  )
}

