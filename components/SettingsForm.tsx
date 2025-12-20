'use client'

import { useState, useEffect } from 'react'
import { Bell, Database, Globe, Shield, Receipt, Mail, MessageSquare } from 'lucide-react'

export default function SettingsForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [taxRate, setTaxRate] = useState('20.0')
  const [companyType, setCompanyType] = useState('auto-entrepreneur')
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Paramètres de notifications
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smsProvider, setSmsProvider] = useState('twilio')
  const [smsApiKey, setSmsApiKey] = useState('')
  const [smsFrom, setSmsFrom] = useState('')

  // Types d'entreprises françaises avec leurs taux de TVA
  const companyTypes = [
    { value: 'auto-entrepreneur', label: 'Auto-entrepreneur / Micro-entreprise', defaultTaxRate: '0', description: 'Franchise de TVA en dessous des seuils' },
    { value: 'eurl', label: 'EURL (Entreprise Unipersonnelle à Responsabilité Limitée)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'sarl', label: 'SARL (Société à Responsabilité Limitée)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'sas', label: 'SAS (Société par Actions Simplifiée)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'sasu', label: 'SASU (SAS Unipersonnelle)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'sci', label: 'SCI (Société Civile Immobilière)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'sa', label: 'SA (Société Anonyme)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'snc', label: 'SNC (Société en Nom Collectif)', defaultTaxRate: '20', description: 'TVA standard 20%' },
    { value: 'autre', label: 'Autre', defaultTaxRate: '20', description: 'TVA personnalisable' },
  ]

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.taxRate) {
          setTaxRate(data.settings.taxRate)
        }
        if (data.settings?.companyType) {
          setCompanyType(data.settings.companyType)
          // Appliquer le taux de TVA par défaut du type d'entreprise si pas de taux personnalisé
          if (!data.settings.taxRate) {
            const selectedType = companyTypes.find(t => t.value === data.settings.companyType)
            if (selectedType) {
              setTaxRate(selectedType.defaultTaxRate)
            }
          }
        }
        // Charger les paramètres de notifications
        if (data.settings?.emailEnabled) {
          setEmailEnabled(data.settings.emailEnabled === 'true')
        }
        if (data.settings?.smsEnabled) {
          setSmsEnabled(data.settings.smsEnabled === 'true')
        }
        if (data.settings?.smtpHost) setSmtpHost(data.settings.smtpHost)
        if (data.settings?.smtpPort) setSmtpPort(data.settings.smtpPort)
        if (data.settings?.smtpUser) setSmtpUser(data.settings.smtpUser)
        if (data.settings?.smtpFrom) setSmtpFrom(data.settings.smtpFrom)
        if (data.settings?.smsProvider) setSmsProvider(data.settings.smsProvider)
        if (data.settings?.smsApiKey) setSmsApiKey(data.settings.smsApiKey)
        if (data.settings?.smsFrom) setSmsFrom(data.settings.smsFrom)
        setLoadingSettings(false)
      })
      .catch(err => {
        console.error('Erreur:', err)
        setLoadingSettings(false)
      })
  }, [])

  const handleCompanyTypeChange = (newType: string) => {
    setCompanyType(newType)
    const selectedType = companyTypes.find(t => t.value === newType)
    if (selectedType) {
      setTaxRate(selectedType.defaultTaxRate)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSuccess('')
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taxRate,
          companyType,
          emailEnabled,
          smsEnabled,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPassword: smtpPassword || undefined, // Ne pas envoyer si vide
          smtpFrom,
          smsProvider,
          smsApiKey: smsApiKey || undefined, // Ne pas envoyer si vide
          smsFrom,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Paramètres enregistrés avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setSuccess(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      setSuccess('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications Email */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Mail className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Notifications Email</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Activer les notifications email</p>
              <p className="text-sm text-gray-500">Envoyer automatiquement des emails aux clients à chaque étape</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {emailEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur SMTP (host)
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port SMTP
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email expéditeur
                  </label>
                  <input
                    type="email"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="noreply@votre-entreprise.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateur SMTP
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="votre-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe SMTP
                </label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Mot de passe ou token d'application"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Pour Gmail, utilisez un mot de passe d'application
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications SMS */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Notifications SMS</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Activer les notifications SMS</p>
              <p className="text-sm text-gray-500">Envoyer automatiquement des SMS aux clients à chaque étape</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {smsEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fournisseur SMS
                </label>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="twilio">Twilio</option>
                  <option value="ovh">OVH</option>
                  <option value="custom">API personnalisée</option>
                </select>
              </div>
              {smsProvider === 'custom' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de l'API personnalisée
                  </label>
                  <input
                    type="url"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://api.example.com/sms"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    L'API doit accepter POST avec {"{"}"to": "numéro", "message": "texte", "from": "expéditeur"{"}"}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {smsProvider === 'twilio' ? 'Account SID / API Key' : 'Clé API'}
                  </label>
                  <input
                    type="text"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={smsProvider === 'twilio' ? 'ACxxxxxxxxxxxxx' : 'Votre clé API'}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro expéditeur
                </label>
                <input
                  type="text"
                  value={smsFrom}
                  onChange={(e) => setSmsFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+33612345678"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fiscalité */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Receipt className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Fiscalité</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'entreprise <span className="text-red-500">*</span>
            </label>
            <select
              value={companyType}
              onChange={(e) => handleCompanyTypeChange(e.target.value)}
              disabled={loadingSettings}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-50"
            >
              {companyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {companyTypes.find(t => t.value === companyType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de TVA (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              disabled={loadingSettings || companyType === 'auto-entrepreneur'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-50"
              placeholder="20.0"
            />
            <p className="mt-1 text-xs text-gray-500">
              {companyType === 'auto-entrepreneur' 
                ? 'Les auto-entrepreneurs sont en franchise de TVA en dessous des seuils (0%). Le taux sera automatiquement appliqué.'
                : 'Taux de TVA par défaut utilisé pour les factures. Conforme à la législation en vigueur.'}
            </p>
            {companyType === 'auto-entrepreneur' && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note :</strong> Les auto-entrepreneurs sont exonérés de TVA en dessous des seuils de chiffre d'affaires (176 200€ pour les prestations de services, 72 600€ pour les ventes). Au-delà, vous devez opter pour le régime réel et facturer la TVA.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Préférences */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Préférences</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white">
              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Base de données */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Base de données</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Type de base de données: <span className="font-medium">SQLite</span>
            </p>
            <p className="text-sm text-gray-500">
              La base de données est stockée localement dans le fichier dev.db
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => window.open('/api/db/backup', '_blank')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Sauvegarder la base de données
            </button>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Sécurité</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Authentification: <span className="font-medium">NextAuth.js</span>
            </p>
            <p className="text-sm text-gray-500">
              Les mots de passe sont cryptés avec bcrypt
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  )
}

