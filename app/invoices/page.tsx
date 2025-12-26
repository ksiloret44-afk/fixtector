import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import InvoicesListEnhanced from '@/components/InvoicesListEnhanced'

// Permettre le cache avec revalidation toutes les 10 secondes
// Les données sensibles (paiements) nécessitent un rafraîchissement fréquent
export const revalidate = 10
export const dynamic = 'force-dynamic' // Nécessaire pour l'authentification

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

  // Récupérer toutes les factures (le composant client gère le filtrage)
  const invoices = await companyPrisma.invoice.findMany({
    take: 500, // Augmenter la limite pour permettre plus de factures
    select: {
      id: true,
      invoiceNumber: true,
      finalAmount: true,
      totalCost: true,
      paymentStatus: true,
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
  const invoicesWithStringDates = invoices.map(invoice => ({
    ...invoice,
    createdAt: invoice.createdAt.toISOString(),
    repair: invoice.repair || null,
  }))

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


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Factures</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gérez vos factures et paiements
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">En attente</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.unpaid}</dd>
                      <dd className="text-sm text-gray-500 dark:text-gray-400">{stats.unpaidAmount.toFixed(2)} €</dd>
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
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Payées</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.paid}</dd>
                      <dd className="text-sm text-gray-500 dark:text-gray-400">{stats.paidAmount.toFixed(2)} €</dd>
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
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Partielles</dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.partial}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <InvoicesListEnhanced 
            initialInvoices={invoicesWithStringDates}
            initialStats={stats}
          />
        </div>
      </main>
    </div>
  )
}
