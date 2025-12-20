import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import { FileText, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import InvoiceActionsMenu from '@/components/InvoiceActionsMenu'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function InvoicesPage({
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
  if (statusFilter === 'unpaid') {
    where.paymentStatus = 'unpaid'
  } else if (statusFilter === 'paid') {
    where.paymentStatus = 'paid'
  } else if (statusFilter === 'partial') {
    where.paymentStatus = 'partial'
  }

  const invoices = await companyPrisma.invoice.findMany({
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

  // Calculer les statistiques
  const [
    totalInvoices,
    unpaidInvoices,
    paidInvoices,
    partialInvoices,
    totalUnpaidAmount,
    totalPaidAmount,
  ] = await Promise.all([
    companyPrisma.invoice.count(),
    companyPrisma.invoice.count({ where: { paymentStatus: 'unpaid' } }),
    companyPrisma.invoice.count({ where: { paymentStatus: 'paid' } }),
    companyPrisma.invoice.count({ where: { paymentStatus: 'partial' } }),
    companyPrisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: { paymentStatus: 'unpaid' },
    }),
    companyPrisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: { paymentStatus: 'paid' },
    }),
  ])

  const stats = {
    total: totalInvoices,
    unpaid: unpaidInvoices,
    paid: paidInvoices,
    partial: partialInvoices,
    unpaidAmount: totalUnpaidAmount._sum.finalAmount || 0,
    paidAmount: totalPaidAmount._sum.finalAmount || 0,
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string }> = {
      paid: { label: 'Payée', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      unpaid: { label: 'Impayée', icon: XCircle, className: 'bg-red-100 text-red-800' },
      partial: { label: 'Partielle', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
    }

    const statusInfo = statusMap[status] || { label: status, icon: FileText, className: 'bg-gray-100 text-gray-800' }
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
            <p className="mt-2 text-gray-600">
              Gérez vos factures et paiements
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.unpaid}</dd>
                      <dd className="text-sm text-gray-500">{stats.unpaidAmount.toFixed(2)} €</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Payées</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.paid}</dd>
                      <dd className="text-sm text-gray-500">{stats.paidAmount.toFixed(2)} €</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Partielles</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stats.partial}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-4 flex space-x-2">
            <Link
              href="/invoices"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </Link>
            <Link
              href="/invoices?status=unpaid"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'unpaid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </Link>
            <Link
              href="/invoices?status=paid"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'paid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Payées
            </Link>
            <Link
              href="/invoices?status=partial"
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === 'partial'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Partielles
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune facture</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all'
                  ? 'Les factures apparaîtront ici une fois créées.'
                  : 'Aucune facture trouvée avec ce filtre.'}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-visible sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <Link href={`/invoices/${invoice.id}`} className="flex items-center flex-1">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-primary-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {invoice.customer.firstName} {invoice.customer.lastName}
                              </p>
                              {getPaymentStatusBadge(invoice.paymentStatus)}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              {invoice.repair && (
                                <>
                                  <span>{invoice.repair.deviceType} - {invoice.repair.brand} {invoice.repair.model}</span>
                                  <span className="mx-2">•</span>
                                </>
                              )}
                              <span>Facture #{invoice.invoiceNumber.slice(0, 8)}</span>
                              <span className="mx-2">•</span>
                              <span>Créée le {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                            </div>
                          </div>
                        </Link>
                        <div className="ml-4 flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                {invoice.finalAmount.toFixed(2)} € TTC
                              </p>
                              <p className="text-sm text-gray-500">
                                HT: {invoice.totalCost.toFixed(2)} €
                              </p>
                            </div>
                          <InvoiceActionsMenu
                            invoiceId={invoice.id}
                            paymentStatus={invoice.paymentStatus}
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
