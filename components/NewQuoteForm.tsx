'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NewQuoteFormProps {
  repair: any
  userId: string
}

export default function NewQuoteForm({ repair, userId }: NewQuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taxRate, setTaxRate] = useState(20.0)

  // Récupérer le taux de TVA depuis les paramètres
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.taxRate) {
          setTaxRate(parseFloat(data.settings.taxRate))
        }
      })
      .catch(err => console.error('Erreur:', err))
  }, [])

  const partsCostHT = repair.parts.reduce(
    (sum: number, rp: any) => sum + rp.quantity * rp.unitPrice,
    0
  )

  const [formData, setFormData] = useState({
    totalAmountTTC: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    notes: '',
  })

  // Calculer le TTC initial si on a un coût estimé
  useEffect(() => {
    if (repair.estimatedCost && !formData.totalAmountTTC) {
      const estimatedTTC = repair.estimatedCost * (1 + taxRate / 100)
      setFormData(prev => ({ ...prev, totalAmountTTC: estimatedTTC.toFixed(2) }))
    }
  }, [repair.estimatedCost, taxRate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const totalAmountTTC = parseFloat(formData.totalAmountTTC) || 0
    // Si TVA = 0%, TTC = HT
    const totalCostHT = taxRate === 0 ? totalAmountTTC : totalAmountTTC / (1 + taxRate / 100)
    const laborCostHT = totalCostHT - partsCostHT
    const totalCost = totalCostHT

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: repair.id,
          customerId: repair.customerId,
          userId,
          laborCost: laborCostHT > 0 ? laborCostHT : totalCostHT,
          partsCost: partsCostHT,
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

  const totalAmountTTC = parseFloat(formData.totalAmountTTC) || 0
  // Si TVA = 0%, TTC = HT
  const totalCostHT = taxRate === 0 ? totalAmountTTC : totalAmountTTC / (1 + taxRate / 100)
  const taxAmount = totalAmountTTC - totalCostHT

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
            Montant total TTC (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.totalAmountTTC}
            onChange={(e) => setFormData({ ...formData, totalAmountTTC: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500">
            Montant toutes taxes comprises (TVA {taxRate}%)
          </p>
        </div>

        {repair.parts.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Pièces détachées (HT): {partsCostHT.toFixed(2)} €</p>
            <p className="text-xs text-gray-500">
              Calculé automatiquement à partir des pièces utilisées
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Total HT:</span>
              <span className="font-medium text-gray-900">
                {totalCostHT.toFixed(2)} €
              </span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">TVA ({taxRate}%):</span>
                <span className="font-medium text-gray-900">
                  {taxAmount.toFixed(2)} €
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total TTC:</span>
              <span className="font-bold text-primary-600">
                {totalAmountTTC.toFixed(2)} €
              </span>
            </div>
            {taxRate === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Auto-entrepreneur : Franchise de TVA (0%)
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valide jusqu'au <span className="text-red-500">*</span>
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
