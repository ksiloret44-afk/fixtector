import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import QuotesListEnhanced from '@/components/QuotesListEnhanced'

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Récupérer la connexion Prisma de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  // Récupérer tous les devis (le composant client gère le filtrage)
  const quotes = await companyPrisma.quote.findMany({
    take: 500, // Augmenter la limite pour permettre plus de devis
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      totalCost: true,
      validUntil: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      repair: {
        select: {
          id: true,
          ticketNumber: true,
          deviceType: true,
          brand: true,
          model: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convertir les dates en strings pour le composant client
  const quotesWithStringDates = quotes.map(quote => ({
    ...quote,
    createdAt: quote.createdAt.toISOString(),
    validUntil: quote.validUntil.toISOString(),
    repair: quote.repair || null,
  }))

  // Optimisation: Paralléliser les requêtes de stats
  const stats = await Promise.all([
    companyPrisma.quote.count(),
    companyPrisma.quote.count({ where: { status: 'pending' } }),
    companyPrisma.quote.count({ where: { status: 'accepted' } }),
    companyPrisma.quote.count({ where: { status: 'rejected' } }),
  ]).then(([total, pending, accepted, rejected]) => ({
    total,
    pending,
    accepted,
    rejected,
  }))


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Devis</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gérez tous vos devis
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">En attente</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Acceptés</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.accepted}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Refusés</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.rejected}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <QuotesListEnhanced 
            initialQuotes={quotesWithStringDates}
            initialStats={stats}
          />
        </div>
      </main>
    </div>
  )
}

