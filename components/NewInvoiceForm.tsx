'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calculator } from 'lucide-react'
import Link from 'next/link'

interface NewInvoiceFormProps {
  repair: any
  userId: string
  initialData?: {
    laborCost?: number
    partsCost?: number
    totalCost?: number
    finalAmount?: number
    taxRate?: number
    notes?: string | null
  }
}

export default function NewInvoiceForm({ repair, userId, initialData }: NewInvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    totalAmountTTC: (initialData?.finalAmount || initialData?.totalCost)?.toString() || '',
    taxRate: initialData?.taxRate?.toString() || '20.0',
    notes: initialData?.notes || '',
  })
  const [taxRate, setTaxRate] = useState(initialData?.taxRate?.toString() || '20.0')

  // Récupérer le taux de TVA depuis les paramètres
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.taxRate) {
          const rate = data.settings.taxRate
          setTaxRate(rate)
          setFormData(prev => ({ ...prev, taxRate: rate }))
        }
      })
      .catch(err => console.error('Erreur:', err))
  }, [])

  // Calculer à partir du TTC
  const totalAmountTTC = parseFloat(formData.totalAmountTTC) || 0
  const taxRateValue = parseFloat(taxRate) || 20.0
  // Si TVA = 0%, TTC = HT
  const totalCostHT = taxRateValue === 0 ? totalAmountTTC : totalAmountTTC / (1 + taxRateValue / 100)
  const taxAmount = totalAmountTTC - totalCostHT
  const finalAmount = totalAmountTTC

  // Calculer le total TTC depuis les pièces de la réparation si disponible
  useEffect(() => {
    if (repair.parts && repair.parts.length > 0 && !initialData && !formData.totalAmountTTC) {
      const calculatedPartsCostHT = repair.parts.reduce((sum: number, rp: any) => {
        return sum + (rp.unitPrice * rp.quantity)
      }, 0)
      // Calculer le TTC à partir du HT
      const calculatedTTC = calculatedPartsCostHT * (1 + taxRateValue / 100)
      setFormData(prev => ({
        ...prev,
        totalAmountTTC: calculatedTTC.toFixed(2),
      }))
    }
  }, [repair.parts, initialData, taxRateValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: repair.id,
          customerId: repair.customerId,
          userId,
          laborCost: totalCostHT * 0.5, // Répartir 50/50 entre main d'œuvre et pièces
          partsCost: totalCostHT * 0.5,
          totalCost: totalCostHT,
          taxRate: taxRateValue,
          taxAmount: taxAmount,
          finalAmount: finalAmount,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      router.push(`/invoices/${data.invoice.id}`)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de la création de la facture')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <Link
          href={`/repairs/${repair.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la réparation
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations client et réparation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Informations</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-medium text-gray-900">
                  {repair.customer.firstName} {repair.customer.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Appareil</p>
                <p className="font-medium text-gray-900">
                  {repair.deviceType} - {repair.brand} {repair.model}
                </p>
              </div>
            </div>
          </div>

          {/* Coûts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Détails de la facture</h3>
            
            <div>
              <label htmlFor="totalAmountTTC" className="block text-sm font-medium text-gray-700 mb-2">
                Montant total TTC (€) <span className="text-red-500">*</span>
              </label>
              <input
                id="totalAmountTTC"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalAmountTTC}
                onChange={(e) => setFormData({ ...formData, totalAmountTTC: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                Montant toutes taxes comprises
              </p>
            </div>

            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
                Taux de TVA (%)
              </label>
              <input
                id="taxRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => {
                  const newRate = e.target.value
                  setTaxRate(newRate)
                  setFormData(prev => ({ ...prev, taxRate: newRate }))
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="20.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Le taux par défaut peut être modifié dans les paramètres
              </p>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Récapitulatif
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium text-gray-900">{totalCostHT.toFixed(2)} €</span>
              </div>
              {taxRateValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA ({taxRateValue}%)</span>
                  <span className="font-medium text-gray-900">{taxAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="text-base font-semibold text-gray-900">Total TTC</span>
                <span className="text-base font-bold text-primary-600">{finalAmount.toFixed(2)} €</span>
              </div>
              {taxRateValue === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-entrepreneur : Franchise de TVA (0%)
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Notes additionnelles..."
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link
              href={`/repairs/${repair.id}`}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

