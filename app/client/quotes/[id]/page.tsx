import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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

  // Récupérer le Customer lié à l'utilisateur
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { customer: true },
  })

  if (!dbUser?.customerId) {
    notFound()
  }

  const quote = await prisma.quote.findUnique({
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

  if (!quote || quote.customerId !== dbUser.customerId) {
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

