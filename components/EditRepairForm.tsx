'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

interface Repair {
  id: string
  deviceType: string
  brand: string
  model: string
  serialNumber: string | null
  issue: string
  status: string
  estimatedCost: number | null
  finalCost: number | null
  estimatedTime: string | null
  notes: string | null
  internalNotes: string | null
  customer: Customer
}

export default function EditRepairForm({ repair, userId }: { repair: Repair; userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taxRate, setTaxRate] = useState(20.0)
  const [estimatedPriceInputType, setEstimatedPriceInputType] = useState<'HT' | 'TTC'>('HT')
  const [estimatedPriceInput, setEstimatedPriceInput] = useState('')
  const [finalPriceInputType, setFinalPriceInputType] = useState<'HT' | 'TTC'>('HT')
  const [finalPriceInput, setFinalPriceInput] = useState('')

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

  // Initialiser les champs de prix avec les valeurs existantes
  useEffect(() => {
    if (repair.estimatedCost) {
      setEstimatedPriceInput(repair.estimatedCost.toString())
      setEstimatedPriceInputType('HT')
    }
    if (repair.finalCost) {
      setFinalPriceInput(repair.finalCost.toString())
      setFinalPriceInputType('HT')
    }
  }, [repair.estimatedCost, repair.finalCost])

  const [formData, setFormData] = useState({
    deviceType: repair.deviceType || '',
    repairType: '',
    brand: repair.brand || '',
    model: repair.model || '',
    serialNumber: repair.serialNumber || '',
    imei: '',
    issue: repair.issue || '',
    status: repair.status || 'pending',
    estimatedCost: repair.estimatedCost?.toString() || '',
    finalCost: repair.finalCost?.toString() || '',
    estimatedTime: repair.estimatedTime || '',
    notes: repair.notes || '',
    internalNotes: repair.internalNotes || '',
  })

  // Calculer HT et TTC pour le coût estimé
  const estimatedPriceValue = parseFloat(estimatedPriceInput) || 0
  const estimatedCostHT = estimatedPriceInputType === 'HT' 
    ? estimatedPriceValue 
    : (taxRate === 0 ? estimatedPriceValue : estimatedPriceValue / (1 + taxRate / 100))
  const estimatedCostTTC = estimatedPriceInputType === 'TTC' 
    ? estimatedPriceValue 
    : (taxRate === 0 ? estimatedPriceValue : estimatedPriceValue * (1 + taxRate / 100))
  const estimatedTaxAmount = estimatedCostTTC - estimatedCostHT

  // Calculer HT et TTC pour le coût final
  const finalPriceValue = parseFloat(finalPriceInput) || 0
  const finalCostHT = finalPriceInputType === 'HT' 
    ? finalPriceValue 
    : (taxRate === 0 ? finalPriceValue : finalPriceValue / (1 + taxRate / 100))
  const finalCostTTC = finalPriceInputType === 'TTC' 
    ? finalPriceValue 
    : (taxRate === 0 ? finalPriceValue : finalPriceValue * (1 + taxRate / 100))
  const finalTaxAmount = finalCostTTC - finalCostHT

  // Mettre à jour les coûts dans formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      estimatedCost: estimatedCostHT > 0 ? estimatedCostHT.toFixed(2) : '',
    }))
  }, [estimatedCostHT])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      finalCost: finalCostHT > 0 ? finalCostHT.toFixed(2) : '',
    }))
  }, [finalCostHT])

  // Types de réparations par catégorie d'appareil
  const repairTypes: Record<string, string[]> = {
    smartphone: [
      'Écran cassé',
      'Écran noir/ne s\'allume plus',
      'Batterie défectueuse',
      'Port de charge défectueux',
      'Haut-parleur ne fonctionne plus',
      'Microphone ne fonctionne plus',
      'Caméra arrière défectueuse',
      'Caméra avant défectueuse',
      'Bouton d\'alimentation défectueux',
      'Bouton volume défectueux',
      'Bouton home défectueux',
      'Connecteur jack audio défectueux',
      'Carte SIM non détectée',
      'Problème de réseau/WiFi',
      'Problème de Bluetooth',
      'Tactile ne répond plus',
      'Écran qui clignote',
      'Surchauffe',
      'Ne charge plus',
      'Charge lente',
      'Problème logiciel/virus',
      'Réinitialisation usine',
      'Déverrouillage',
      'Autre'
    ],
    tablet: [
      'Écran cassé',
      'Écran noir/ne s\'allume plus',
      'Batterie défectueuse',
      'Port de charge défectueux',
      'Haut-parleur ne fonctionne plus',
      'Microphone ne fonctionne plus',
      'Caméra défectueuse',
      'Tactile ne répond plus',
      'Bouton d\'alimentation défectueux',
      'Problème de réseau/WiFi',
      'Ne charge plus',
      'Problème logiciel',
      'Autre'
    ],
    laptop: [
      'Écran cassé',
      'Écran noir/ne s\'allume plus',
      'Écran qui clignote',
      'Clavier défectueux',
      'Touchpad ne fonctionne plus',
      'Batterie défectueuse',
      'Ne charge plus',
      'Port de charge défectueux',
      'Ventilateur bruyant/ne fonctionne plus',
      'Surchauffe',
      'Disque dur défectueux',
      'SSD défectueux',
      'RAM défectueuse',
      'Carte mère défectueuse',
      'Carte graphique défectueuse',
      'Port USB défectueux',
      'Webcam ne fonctionne plus',
      'Haut-parleur ne fonctionne plus',
      'Problème de réseau/WiFi',
      'Problème logiciel/virus',
      'Réinstallation système',
      'Autre'
    ],
    desktop: [
      'Ne démarre plus',
      'Écran noir',
      'Carte mère défectueuse',
      'Processeur défectueux',
      'RAM défectueuse',
      'Disque dur défectueux',
      'SSD défectueux',
      'Carte graphique défectueuse',
      'Alimentation défectueuse',
      'Ventilateur bruyant/ne fonctionne plus',
      'Surchauffe',
      'Port USB défectueux',
      'Problème logiciel/virus',
      'Réinstallation système',
      'Autre'
    ],
    tv: [
      'Écran cassé',
      'Écran noir/ne s\'allume plus',
      'Écran qui clignote',
      'Pas de son',
      'Problème de connectique (HDMI, USB, etc.)',
      'Télécommande ne fonctionne plus',
      'Problème de réseau/WiFi',
      'Problème logiciel',
      'Autre'
    ],
    console: [
      'Ne démarre plus',
      'Surchauffe',
      'Ventilateur bruyant',
      'Disque dur défectueux',
      'Port HDMI défectueux',
      'Manette ne fonctionne plus',
      'Problème de réseau',
      'Problème logiciel',
      'Autre'
    ],
    other: [
      'Réparation générale',
      'Diagnostic',
      'Autre'
    ]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType: formData.deviceType,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber || null,
          issue: formData.issue,
          status: formData.status,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          finalCost: formData.finalCost ? parseFloat(formData.finalCost) : null,
          estimatedTime: formData.estimatedTime || null,
          notes: formData.notes || null,
          internalNotes: formData.internalNotes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push(`/repairs/${repair.id}`)
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

      {/* Client (non modifiable) */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Client</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium text-gray-900">
            {repair.customer.firstName} {repair.customer.lastName}
          </p>
          <p className="text-sm text-gray-500">{repair.customer.phone}</p>
          {repair.customer.email && (
            <p className="text-sm text-gray-500">{repair.customer.email}</p>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Le client ne peut pas être modifié. Créez une nouvelle réparation pour un autre client.
        </p>
      </div>

      {/* Informations réparation */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Informations de la réparation</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'appareil *
            </label>
            <select
              required
              value={formData.deviceType}
              onChange={(e) => {
                setFormData({ ...formData, deviceType: e.target.value, repairType: '' })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Sélectionner...</option>
              <option value="smartphone">Smartphone</option>
              <option value="tablet">Tablette</option>
              <option value="laptop">Ordinateur portable</option>
              <option value="desktop">Ordinateur de bureau</option>
              <option value="tv">Télévision</option>
              <option value="console">Console de jeu</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="waiting_parts">En attente de pièces</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque *
            </label>
            <input
              type="text"
              required
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Apple, Samsung, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modèle *
            </label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de série
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Numéro de série"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMEI
            </label>
            <input
              type="text"
              value={formData.imei}
              onChange={(e) => setFormData({ ...formData, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="IMEI (15 chiffres)"
              maxLength={15}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Problème / Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Décrivez le problème rencontré..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coût estimé
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="estimatedPriceType"
                    value="HT"
                    checked={estimatedPriceInputType === 'HT'}
                    onChange={(e) => {
                      if (estimatedPriceInputType === 'TTC' && estimatedPriceInput) {
                        const currentValue = parseFloat(estimatedPriceInput) || 0
                        if (taxRate > 0) {
                          const htValue = currentValue / (1 + taxRate / 100)
                          setEstimatedPriceInput(htValue.toFixed(2))
                        }
                      }
                      setEstimatedPriceInputType('HT')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">HT</span>
                </label>
                <label className="flex items-center ml-4">
                  <input
                    type="radio"
                    name="estimatedPriceType"
                    value="TTC"
                    checked={estimatedPriceInputType === 'TTC'}
                    onChange={(e) => {
                      if (estimatedPriceInputType === 'HT' && estimatedPriceInput) {
                        const currentValue = parseFloat(estimatedPriceInput) || 0
                        if (taxRate > 0) {
                          const ttcValue = currentValue * (1 + taxRate / 100)
                          setEstimatedPriceInput(ttcValue.toFixed(2))
                        }
                      }
                      setEstimatedPriceInputType('TTC')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">TTC</span>
                </label>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={estimatedPriceInput}
                onChange={(e) => setEstimatedPriceInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="0.00"
              />
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">HT:</span>
                  <span className="font-medium text-gray-900">{estimatedCostHT.toFixed(2)} €</span>
                </div>
                {taxRate > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TVA ({taxRate}%):</span>
                      <span className="font-medium text-gray-900">{estimatedTaxAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">TTC:</span>
                      <span className="font-bold text-primary-600">{estimatedCostTTC.toFixed(2)} €</span>
                    </div>
                  </>
                )}
                {taxRate === 0 && (
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">TTC:</span>
                    <span className="font-bold text-primary-600">{estimatedCostTTC.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coût final
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="finalPriceType"
                    value="HT"
                    checked={finalPriceInputType === 'HT'}
                    onChange={(e) => {
                      if (finalPriceInputType === 'TTC' && finalPriceInput) {
                        const currentValue = parseFloat(finalPriceInput) || 0
                        if (taxRate > 0) {
                          const htValue = currentValue / (1 + taxRate / 100)
                          setFinalPriceInput(htValue.toFixed(2))
                        }
                      }
                      setFinalPriceInputType('HT')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">HT</span>
                </label>
                <label className="flex items-center ml-4">
                  <input
                    type="radio"
                    name="finalPriceType"
                    value="TTC"
                    checked={finalPriceInputType === 'TTC'}
                    onChange={(e) => {
                      if (finalPriceInputType === 'HT' && finalPriceInput) {
                        const currentValue = parseFloat(finalPriceInput) || 0
                        if (taxRate > 0) {
                          const ttcValue = currentValue * (1 + taxRate / 100)
                          setFinalPriceInput(ttcValue.toFixed(2))
                        }
                      }
                      setFinalPriceInputType('TTC')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">TTC</span>
                </label>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalPriceInput}
                onChange={(e) => setFinalPriceInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="0.00"
              />
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">HT:</span>
                  <span className="font-medium text-gray-900">{finalCostHT.toFixed(2)} €</span>
                </div>
                {taxRate > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TVA ({taxRate}%):</span>
                      <span className="font-medium text-gray-900">{finalTaxAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">TTC:</span>
                      <span className="font-bold text-primary-600">{finalCostTTC.toFixed(2)} €</span>
                    </div>
                  </>
                )}
                {taxRate === 0 && (
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">TTC:</span>
                    <span className="font-bold text-primary-600">{finalCostTTC.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Durée estimée
          </label>
          <input
            type="text"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Ex: 2-3 jours"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (visibles par le client)
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Notes supplémentaires..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes internes (non visibles par le client)
          </label>
          <textarea
            rows={3}
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Notes internes..."
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
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  )
}

