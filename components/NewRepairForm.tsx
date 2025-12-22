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

export default function NewRepairForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchCustomer, setSearchCustomer] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [taxRate, setTaxRate] = useState(20.0)
  const [priceInputType, setPriceInputType] = useState<'HT' | 'TTC'>('HT')
  const [priceInput, setPriceInput] = useState('')

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

  const [formData, setFormData] = useState({
    // Customer fields
    customerFirstName: '',
    customerLastName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerCity: '',
    customerPostalCode: '',
    // Repair fields
    deviceType: '',
    repairType: '',
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    issue: '',
    estimatedCost: '',
    estimatedTime: '',
    notes: '',
  })

  // Calculer HT et TTC selon le type de saisie
  const priceValue = parseFloat(priceInput) || 0
  const estimatedCostHT = priceInputType === 'HT' 
    ? priceValue 
    : (taxRate === 0 ? priceValue : priceValue / (1 + taxRate / 100))
  const estimatedCostTTC = priceInputType === 'TTC' 
    ? priceValue 
    : (taxRate === 0 ? priceValue : priceValue * (1 + taxRate / 100))
  const taxAmount = estimatedCostTTC - estimatedCostHT

  // Mettre à jour le coût estimé (en HT) quand le prix change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      estimatedCost: estimatedCostHT > 0 ? estimatedCostHT.toFixed(2) : '',
    }))
  }, [estimatedCostHT])

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
      'Haut-parleur ne fonctionne plus',
      'Microphone ne fonctionne plus',
      'Webcam ne fonctionne plus',
      'Port USB défectueux',
      'Port HDMI défectueux',
      'Charnière cassée',
      'Problème logiciel/virus',
      'Réinstallation système',
      'Récupération de données',
      'Nettoyage interne',
      'Autre'
    ],
    desktop: [
      'Ne démarre plus',
      'Écran noir',
      'Carte mère défectueuse',
      'Processeur défectueux',
      'Carte graphique défectueuse',
      'RAM défectueuse',
      'Disque dur défectueux',
      'SSD défectueux',
      'Alimentation défectueuse',
      'Ventilateur bruyant/ne fonctionne plus',
      'Surchauffe',
      'Port USB défectueux',
      'Port HDMI/VGA défectueux',
      'Haut-parleur ne fonctionne plus',
      'Microphone ne fonctionne plus',
      'Problème logiciel/virus',
      'Réinstallation système',
      'Récupération de données',
      'Nettoyage interne',
      'Mise à niveau matériel',
      'Autre'
    ],
    tv: [
      'Écran cassé',
      'Écran noir/ne s\'allume plus',
      'Écran qui clignote',
      'Pas de son',
      'Son déformé',
      'Télécommande ne fonctionne plus',
      'Port HDMI défectueux',
      'Port USB défectueux',
      'WiFi ne fonctionne plus',
      'Problème de rétroéclairage',
      'Pixels morts',
      'Image déformée',
      'Couleurs incorrectes',
      'Problème logiciel',
      'Autre'
    ],
    console: [
      'Ne démarre plus',
      'Ne lit plus les disques',
      'Manette ne fonctionne plus',
      'Port HDMI défectueux',
      'Port USB défectueux',
      'Surchauffe',
      'Ventilateur bruyant',
      'Problème de réseau/WiFi',
      'Problème de connexion en ligne',
      'Disque dur défectueux',
      'Problème logiciel',
      'Réinitialisation',
      'Nettoyage',
      'Autre'
    ],
    other: [
      'Réparation générale',
      'Diagnostic',
      'Nettoyage',
      'Mise à jour logicielle',
      'Autre'
    ]
  }

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([])
      return
    }

    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query.trim())}`)
      if (!response.ok) {
        console.error('Erreur HTTP:', response.status)
        setCustomers([])
        return
      }
      const data = await response.json()
      console.log('Clients trouvés:', data) // Debug
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur lors de la recherche:', err)
      setCustomers([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          customerId: selectedCustomer?.id,
          repairType: formData.repairType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push(`/repairs/${data.repair.id}`)
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

      {/* Sélection/Création client */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Client</h2>
        
        {!selectedCustomer && !showNewCustomer && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher un client existant
              </label>
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => {
                  setSearchCustomer(e.target.value)
                  searchCustomers(e.target.value)
                }}
                placeholder="Nom, prénom ou téléphone..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              />
              {customers.length > 0 && (
                <ul className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
                  {customers.map((customer) => (
                    <li
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setSearchCustomer('')
                        setCustomers([])
                      }}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">ou</span>
            </div>
            <button
              type="button"
              onClick={() => setShowNewCustomer(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Créer un nouveau client
            </button>
          </div>
        )}

        {selectedCustomer && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Changer
              </button>
            </div>
          </div>
        )}

        {showNewCustomer && !selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerFirstName}
                  onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerLastName}
                  onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNewCustomer(false)}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              ← Retour à la recherche
            </button>
          </div>
        )}
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
              Type de réparation *
            </label>
            <select
              required
              value={formData.repairType}
              onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              disabled={!formData.deviceType}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.deviceType ? 'Sélectionner un type...' : 'Sélectionnez d\'abord un appareil'}
              </option>
              {formData.deviceType && repairTypes[formData.deviceType]?.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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
              IMEI {(formData.deviceType === 'smartphone' || formData.deviceType === 'tablet') && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={formData.deviceType === 'smartphone' || formData.deviceType === 'tablet'}
              value={formData.imei}
              onChange={(e) => setFormData({ ...formData, imei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="IMEI (15 chiffres)"
              maxLength={15}
            />
            {(formData.deviceType === 'smartphone' || formData.deviceType === 'tablet') && (
              <p className="mt-1 text-xs text-gray-500">
                IMEI requis pour les smartphones et tablettes
              </p>
            )}
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
            placeholder={formData.repairType ? `Type de réparation: ${formData.repairType}\n\nDécrivez plus en détail le problème...` : "Décrivez le problème rencontré..."}
          />
          {formData.repairType && (
            <p className="mt-1 text-xs text-gray-500">
              Type sélectionné: <span className="font-medium">{formData.repairType}</span>
            </p>
          )}
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
                    name="priceType"
                    value="HT"
                    checked={priceInputType === 'HT'}
                    onChange={(e) => {
                      // Convertir de TTC à HT si on passe de TTC à HT
                      if (priceInputType === 'TTC' && priceInput) {
                        const currentValue = parseFloat(priceInput) || 0
                        if (taxRate > 0) {
                          const htValue = currentValue / (1 + taxRate / 100)
                          setPriceInput(htValue.toFixed(2))
                        }
                      }
                      setPriceInputType('HT')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">HT</span>
                </label>
                <label className="flex items-center ml-4">
                  <input
                    type="radio"
                    name="priceType"
                    value="TTC"
                    checked={priceInputType === 'TTC'}
                    onChange={(e) => {
                      // Convertir de HT à TTC si on passe de HT à TTC
                      if (priceInputType === 'HT' && priceInput) {
                        const currentValue = parseFloat(priceInput) || 0
                        if (taxRate > 0) {
                          const ttcValue = currentValue * (1 + taxRate / 100)
                          setPriceInput(ttcValue.toFixed(2))
                        }
                      }
                      setPriceInputType('TTC')
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
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
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
                      <span className="font-medium text-gray-900">{taxAmount.toFixed(2)} €</span>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Notes supplémentaires..."
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
          disabled={loading || (!selectedCustomer && !showNewCustomer)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Création...' : 'Créer la réparation'}
        </button>
      </div>
    </form>
  )
}

