import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import NewQuoteForm from '@/components/NewQuoteForm'
import { notFound } from 'next/navigation'

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: { repairId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (!searchParams.repairId) {
    redirect('/repairs')
  }

  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  const repair = await companyPrisma.repair.findUnique({
    where: { id: searchParams.repairId },
    include: {
      customer: true,
      parts: {
        include: {
          part: true,
        },
      },
      quote: true,
    },
  })

  if (!repair) {
    notFound()
  }

  if (repair.quote) {
    redirect(`/quotes/${repair.quote.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Nouveau devis
          </h1>
          <NewQuoteForm
            repair={repair}
            userId={(session.user as any).id}
          />
        </div>
      </main>
    </div>
  )
}

