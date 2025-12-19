'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewQuoteFormProps {
  repair: any
  userId: string
}

export default function NewQuoteForm({ repair, userId }: NewQuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const partsCost = repair.parts.reduce(
    (sum: number, rp: any) => sum + rp.quantity * rp.unitPrice,
    0
  )

  const [formData, setFormData] = useState({
    laborCost: repair.estimatedCost ? repair.estimatedCost.toString() : '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const laborCost = parseFloat(formData.laborCost) || 0
    const totalCost = laborCost + partsCost

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: repair.id,
          customerId: repair.customerId,
          userId,
          laborCost,
          partsCost,
          totalCost,
          validUntil: formData.validUntil,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push(`/quotes/${data.quote.id}`)
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Réparation</h3>
        <p className="text-sm text-gray-900">
          {repair.deviceType} - {repair.brand} {repair.model}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Client: {repair.customer.firstName} {repair.customer.lastName}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coût de la main d'œuvre (€) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.laborCost}
            onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

        {repair.parts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coût des pièces (€)
            </label>
            <input
              type="text"
              value={partsCost.toFixed(2)}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Calculé automatiquement à partir des pièces utilisées
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total (€)
          </label>
          <input
            type="text"
            value={((parseFloat(formData.laborCost) || 0) + partsCost).toFixed(2)}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-lg font-semibold"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valide jusqu'au *
          </label>
          <input
            type="date"
            required
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Notes additionnelles pour le devis..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Création...' : 'Créer le devis'}
        </button>
      </div>
    </form>
  )
}

