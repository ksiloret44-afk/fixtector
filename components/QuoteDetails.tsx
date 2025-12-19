'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { FileText, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface QuoteDetailsProps {
  quote: any
}

export default function QuoteDetails({ quote }: QuoteDetailsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Accepté', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
      expired: { label: 'Expiré', className: 'bg-gray-100 text-gray-800' },
    }

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const isValid = new Date(quote.validUntil) >= new Date()

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Devis #{quote.quoteNumber.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Créé le {format(new Date(quote.createdAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          {getStatusBadge(quote.status)}
        </div>

        {quote.status === 'pending' && isValid && (
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => updateStatus('accepted')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter
            </button>
            <button
              onClick={() => updateStatus('rejected')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Refuser
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Client</p>
            <p className="text-sm text-gray-900">
              {quote.customer.firstName} {quote.customer.lastName}
            </p>
            <p className="text-sm text-gray-500">{quote.customer.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Appareil</p>
            <p className="text-sm text-gray-900">
              {quote.repair.deviceType} - {quote.repair.brand} {quote.repair.model}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Détails</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Main d'œuvre</span>
              <span className="text-sm font-medium text-gray-900">{quote.laborCost.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pièces détachées</span>
              <span className="text-sm font-medium text-gray-900">{quote.partsCost.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-base font-bold text-primary-600">{quote.totalCost.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{quote.notes}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <Calendar className="inline h-4 w-4 mr-1" />
            Valide jusqu'au {format(new Date(quote.validUntil), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href={`/repairs/${quote.repairId}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            ← Retour à la réparation
          </Link>
        </div>
      </div>
    </div>
  )
}

