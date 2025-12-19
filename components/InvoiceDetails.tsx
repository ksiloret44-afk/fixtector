'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Calculator } from 'lucide-react'
import Link from 'next/link'

interface InvoiceDetailsProps {
  invoice: any
  isClient?: boolean // Si true, c'est un client qui consulte
}

export default function InvoiceDetails({ invoice, isClient = false }: InvoiceDetailsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      paid: { label: 'Payée', className: 'bg-green-100 text-green-800' },
      unpaid: { label: 'Impayée', className: 'bg-red-100 text-red-800' },
      partial: { label: 'Partielle', className: 'bg-yellow-100 text-yellow-800' },
    }

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleMarkAsPaid = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facture #{invoice.invoiceNumber.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Créée le {format(new Date(invoice.createdAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          {getPaymentStatusBadge(invoice.paymentStatus)}
        </div>

        {!isClient && invoice.paymentStatus !== 'paid' && (
          <div className="mb-6">
            <button
              onClick={handleMarkAsPaid}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Traitement...' : 'Marquer comme payée'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Client</p>
            <p className="text-sm text-gray-900">
              {invoice.customer.firstName} {invoice.customer.lastName}
            </p>
            <p className="text-sm text-gray-500">{invoice.customer.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Appareil</p>
            <p className="text-sm text-gray-900">
              {invoice.repair.deviceType} - {invoice.repair.brand} {invoice.repair.model}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Détails
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Main d'œuvre</span>
              <span className="text-sm font-medium text-gray-900">{invoice.laborCost.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pièces détachées</span>
              <span className="text-sm font-medium text-gray-900">{invoice.partsCost.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Total HT</span>
              <span className="text-sm font-medium text-gray-900">{invoice.totalCost.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">TVA ({invoice.taxRate}%)</span>
              <span className="text-sm font-medium text-gray-900">{invoice.taxAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-gray-300">
              <span className="text-base font-semibold text-gray-900">Total TTC</span>
              <span className="text-base font-bold text-primary-600">{invoice.finalAmount.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{invoice.notes}</p>
          </div>
        )}

        {invoice.paidAt && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <Calendar className="inline h-4 w-4 mr-1" />
              Payée le {format(new Date(invoice.paidAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href={isClient ? `/client/repairs/${invoice.repairId}` : `/repairs/${invoice.repairId}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            ← Retour à la réparation
          </Link>
        </div>
      </div>
    </div>
  )
}

