import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMainPrisma, getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { Wrench, FileText, Receipt, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function ClientPage() {
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
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Votre compte n'est pas encore lié à une entreprise.</p>
              <p className="text-sm text-gray-500 mt-2">Contactez l'administrateur pour résoudre ce problème.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Récupérer le client depuis la base de données de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Erreur de connexion à la base de données.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Trouver le customer par email de l'utilisateur
  const customer = await companyPrisma.customer.findFirst({
    where: { email: user.email },
  })

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Votre compte n'est pas encore lié à un profil client.</p>
              <p className="text-sm text-gray-500 mt-2">Contactez l'administrateur pour résoudre ce problème.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Récupérer les réparations, devis et factures du client
  const [repairs, quotes, invoices] = await Promise.all([
    companyPrisma.repair.findMany({
      where: { customerId: customer.id },
      include: {
        quote: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    companyPrisma.quote.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    companyPrisma.invoice.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-800', icon: Wrench },
      waiting_parts: { label: 'En attente de pièces', className: 'bg-orange-100 text-orange-800', icon: Clock },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800', icon: XCircle },
    }
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: Clock }
    const Icon = statusInfo.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </span>
    )
  }

  const getQuoteStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Accepté', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
      expired: { label: 'Expiré', className: 'bg-gray-100 text-gray-800' },
    }
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getInvoiceStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      paid: { label: 'Payée', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      unpaid: { label: 'Impayée', className: 'bg-red-100 text-red-800', icon: XCircle },
      partial: { label: 'Partielle', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    }
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800', icon: FileText }
    const Icon = statusInfo.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon espace client</h1>
              <p className="mt-2 text-gray-600">
                Bienvenue {customer.firstName} {customer.lastName}
              </p>
            </div>
            <Link
              href="/client/reviews"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Laisser un avis
            </Link>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Wrench className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Mes réparations</dt>
                      <dd className="text-lg font-semibold text-gray-900">{repairs.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <Receipt className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Mes devis</dt>
                      <dd className="text-lg font-semibold text-gray-900">{quotes.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Mes factures</dt>
                      <dd className="text-lg font-semibold text-gray-900">{invoices.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Réparations récentes */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Mes réparations</h2>
            </div>
            {repairs.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Aucune réparation pour le moment
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {repairs.map((repair) => (
                  <li key={repair.id}>
                    <Link href={`/client/repairs/${repair.id}`} className="block hover:bg-gray-50 transition-colors">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {repair.deviceType} - {repair.brand} {repair.model}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Réparation #{repair.ticketNumber.slice(0, 8)} • {format(new Date(repair.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="ml-4">
                            {getStatusBadge(repair.status)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Devis récents */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Mes devis</h2>
            </div>
            {quotes.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Aucun devis pour le moment
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <li key={quote.id}>
                    <Link href={`/client/quotes/${quote.id}`} className="block hover:bg-gray-50 transition-colors">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Devis #{quote.quoteNumber.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {(quote.totalCost * 1.2).toFixed(2)} € TTC • {format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="ml-4">
                            {getQuoteStatusBadge(quote.status)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Factures récentes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Mes factures</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Aucune facture pour le moment
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link href={`/client/invoices/${invoice.id}`} className="block hover:bg-gray-50 transition-colors">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Facture #{invoice.invoiceNumber.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {invoice.finalAmount.toFixed(2)} € TTC • {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="ml-4">
                            {getInvoiceStatusBadge(invoice.paymentStatus)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

