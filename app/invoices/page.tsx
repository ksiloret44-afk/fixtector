import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      repair: true,
    },
    orderBy: { createdAt: 'desc' },
  })

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

          {invoices.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune facture</h3>
              <p className="mt-1 text-sm text-gray-500">
                Les factures apparaîtront ici une fois créées.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          #{invoice.invoiceNumber.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.customer.firstName} {invoice.customer.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.finalAmount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(invoice.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

