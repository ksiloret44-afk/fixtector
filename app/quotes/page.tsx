import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import QuoteActionsMenu from '@/components/QuoteActionsMenu'

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

  const statusFilter = searchParams.status || 'all'

  const where: any = {}
  if (statusFilter === 'pending') {
    where.status = 'pending'
  } else if (statusFilter === 'accepted') {
    where.status = 'accepted'
  } else if (statusFilter === 'rejected') {
    where.status = 'rejected'
  } else if (statusFilter === 'expired') {
    where.status = 'pending'
    where.validUntil = { lt: new Date() }
  }

  const quotes = await companyPrisma.quote.findMany({
    where,
    include: {
      customer: true,
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

  // Filtrer les devis expirés si nécessaire
  const filteredQuotes = statusFilter === 'expired'
    ? quotes.filter(q => q.status === 'pending' && new Date(q.validUntil) < new Date())
    : quotes

  const stats = {
    total: await companyPrisma.quote.count(),
    pending: await companyPrisma.quote.count({ where: { status: 'pending' } }),
    accepted: await companyPrisma.quote.count({ where: { status: 'accepted' } }),
    rejected: await companyPrisma.quote.count({ where: { status: 'rejected' } }),
  }

  const getStatusBadge = (quote: any) => {
    const isExpired = quote.status === 'pending' && new Date(quote.validUntil) < new Date()
    
    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Expiré
        </span>
      )
    }

    switch (quote.status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepté
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Refusé
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Devis</h1>
            <p className="mt-2 text-gray-600">
              Gérez tous vos devis
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Acceptés</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.accepted}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Refusés</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.rejected}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-4 flex space-x-2">
            <Link
              href="/quotes"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </Link>
            <Link
              href="/quotes?status=pending"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </Link>
            <Link
              href="/quotes?status=accepted"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'accepted'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Acceptés
            </Link>
            <Link
              href="/quotes?status=rejected"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'rejected'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Refusés
            </Link>
            <Link
              href="/quotes?status=expired"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'expired'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expirés
            </Link>
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun devis</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all'
                  ? 'Commencez par créer votre premier devis depuis une réparation.'
                  : 'Aucun devis trouvé avec ce filtre.'}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-visible sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <li key={quote.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <Link href={`/quotes/${quote.id}`} className="flex items-center flex-1">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-primary-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {quote.customer.firstName} {quote.customer.lastName}
                              </p>
                              {getStatusBadge(quote)}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              {quote.repair && (
                                <>
                                  <span>{quote.repair.deviceType} - {quote.repair.brand} {quote.repair.model}</span>
                                  <span className="mx-2">•</span>
                                </>
                              )}
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Créé le {format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                              <span className="mx-2">•</span>
                              <span>Valide jusqu'au {format(new Date(quote.validUntil), 'dd MMM yyyy', { locale: fr })}</span>
                            </div>
                          </div>
                        </Link>
                        <div className="ml-4 flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                {(quote.totalCost * 1.2).toFixed(2)} € TTC
                              </p>
                              <p className="text-sm text-gray-500">
                                HT: {quote.totalCost.toFixed(2)} €
                              </p>
                            </div>
                          <QuoteActionsMenu
                            quoteId={quote.id}
                            status={quote.status}
                            repairId={quote.repairId}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

