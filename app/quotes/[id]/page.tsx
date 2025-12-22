import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import QuoteDetails from '@/components/QuoteDetails'
import { notFound } from 'next/navigation'

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    notFound()
  }

  const quote = await companyPrisma.quote.findUnique({
    where: { id: params.id },
    include: {
      repair: {
        include: {
          customer: true,
          parts: {
            include: {
              part: true,
            },
          },
          invoice: true,
        },
      },
      customer: true,
    },
  })

  if (!quote) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <QuoteDetails quote={quote} />
        </div>
      </main>
    </div>
  )
}

