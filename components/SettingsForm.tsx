'use client'

import { useState, useEffect } from 'react'
import { Bell, Database, Globe, Shield, Receipt, Mail, MessageSquare, Building2, Upload, X, Image as ImageIcon, Lock, Unlock } from 'lucide-react'

export default function SettingsForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [taxRate, setTaxRate] = useState('20.0')
  const [companyType, setCompanyType] = useState('auto-entrepreneur')
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Informations légales de l'entreprise
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    siret: '',
    siren: '',
    rcs: '',
    rcsCity: '',
    vatNumber: '',
    legalForm: '',
    capital: '',
    director: '',
  })
  
  // Logo de l'entreprise
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
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
  
  // Paramètres SSL
  const [sslEnabled, setSslEnabled] = useState(false)
  const [forceHttps, setForceHttps] = useState(false)
  const [sslStatus, setSslStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking')

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
    // Charger les paramètres
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
        // Charger les paramètres SSL
        if (data.settings?.sslEnabled) {
          setSslEnabled(data.settings.sslEnabled === 'true')
        }
        if (data.settings?.forceHttps) {
          setForceHttps(data.settings.forceHttps === 'true')
        }
      })
      .catch(err => {
        console.error('Erreur:', err)
      })
    
    // Charger les informations de l'entreprise
    fetch('/api/company')
      .then(res => res.json())
      .then(data => {
        if (data.company) {
          setCompanyInfo({
            name: data.company.name || '',
            email: data.company.email || '',
            phone: data.company.phone || '',
            address: data.company.address || '',
            city: data.company.city || '',
            postalCode: data.company.postalCode || '',
            country: data.company.country || 'France',
            siret: data.company.siret || '',
            siren: data.company.siren || '',
            rcs: data.company.rcs || '',
            rcsCity: data.company.rcsCity || '',
            vatNumber: data.company.vatNumber || '',
            legalForm: data.company.legalForm || '',
            capital: data.company.capital || '',
            director: data.company.director || '',
          })
          if (data.company.logoUrl) {
            setLogoUrl(data.company.logoUrl)
            setLogoPreview(data.company.logoUrl)
          }
        }
        setLoadingSettings(false)
      })
      .catch(err => {
        console.error('Erreur:', err)
        setLoadingSettings(false)
      })
    
    // Vérifier le statut SSL
    checkSslStatus()
  }, [])
  
  const checkSslStatus = async () => {
    setSslStatus('checking')
    try {
      const response = await fetch('/api/ssl/status')
      const data = await response.json()
      if (data.sslActive) {
        setSslStatus('active')
        setSslEnabled(true)
      } else {
        setSslStatus('inactive')
      }
    } catch (err) {
      console.error('Erreur lors de la vérification SSL:', err)
      setSslStatus('error')
    }
  }
  
  const handleSslToggle = async (enabled: boolean) => {
    setSslEnabled(enabled)
    try {
      const response = await fetch('/api/ssl/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, forceHttps }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(enabled ? 'SSL activé avec succès' : 'SSL désactivé')
        setTimeout(() => setSuccess(''), 3000)
        checkSslStatus()
      } else {
        setSuccess(data.error || 'Erreur lors de la modification SSL')
        setSslEnabled(!enabled) // Revert
      }
    } catch (err) {
      console.error('Erreur:', err)
      setSuccess('Erreur lors de la modification SSL')
      setSslEnabled(!enabled) // Revert
    }
  }
  
  const handleForceHttpsToggle = async (enabled: boolean) => {
    setForceHttps(enabled)
    try {
      const response = await fetch('/api/ssl/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: sslEnabled, forceHttps: enabled }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(enabled ? 'Redirection HTTPS forcée activée' : 'Redirection HTTPS forcée désactivée')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setSuccess(data.error || 'Erreur lors de la modification')
        setForceHttps(!enabled) // Revert
      }
    } catch (err) {
      console.error('Erreur:', err)
      setSuccess('Erreur lors de la modification')
      setForceHttps(!enabled) // Revert
    }
  }
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé. Formats acceptés: JPEG, PNG, SVG, WebP')
      return
    }

    // Vérifier la taille
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux. Taille maximale: 5MB')
      return
    }

    setLogoUploading(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/company/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setLogoUrl(data.logoUrl)
        setLogoPreview(data.logoUrl)
        setSuccess('Logo uploadé avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        alert(data.error || 'Erreur lors de l\'upload du logo')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'upload du logo')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer le logo ?')) {
      return
    }

    try {
      const response = await fetch('/api/company/logo', {
        method: 'DELETE',
      })

      if (response.ok) {
        setLogoUrl(null)
        setLogoPreview(null)
        setSuccess('Logo supprimé avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        alert('Erreur lors de la suppression du logo')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la suppression du logo')
    }
  }

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
      // Sauvegarder les paramètres
      const settingsResponse = await fetch('/api/settings', {
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
          smtpPassword: smtpPassword || undefined,
          smtpFrom,
          smsProvider,
          smsApiKey: smsApiKey || undefined,
          smsFrom,
          sslEnabled: sslEnabled.toString(),
          forceHttps: forceHttps.toString(),
        }),
      })

      // Sauvegarder les informations de l'entreprise
      const companyResponse = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyInfo),
      })

      if (settingsResponse.ok && companyResponse.ok) {
        setSuccess('Paramètres enregistrés avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const settingsData = await settingsResponse.json()
        const companyData = await companyResponse.json()
        setSuccess(settingsData.error || companyData.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      setSuccess('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo de l'entreprise */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Logo de l'entreprise</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Le logo sera utilisé dans les devis, factures et pages de suivi client.
            </p>
            
            {logoPreview ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo entreprise" 
                    className="h-24 w-auto object-contain border border-gray-200 rounded-lg p-2 bg-white"
                  />
                  <button
                    onClick={handleLogoDelete}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Supprimer le logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {logoUploading ? 'Upload en cours...' : 'Remplacer le logo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={logoUploading}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, SVG ou WebP (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={logoUploading}
                />
              </label>
            )}
            
            {logoUploading && (
              <div className="mt-2 text-sm text-gray-500">
                Upload en cours...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations légales de l'entreprise */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Informations légales de l'entreprise</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forme juridique
              </label>
              <input
                type="text"
                value={companyInfo.legalForm}
                onChange={(e) => setCompanyInfo({ ...companyInfo, legalForm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="SARL, SAS, EURL, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIRET
              </label>
              <input
                type="text"
                value={companyInfo.siret}
                onChange={(e) => setCompanyInfo({ ...companyInfo, siret: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="12345678901234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIREN
              </label>
              <input
                type="text"
                value={companyInfo.siren}
                onChange={(e) => setCompanyInfo({ ...companyInfo, siren: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RCS
              </label>
              <input
                type="text"
                value={companyInfo.rcs}
                onChange={(e) => setCompanyInfo({ ...companyInfo, rcs: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123 456 789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville du RCS
              </label>
              <input
                type="text"
                value={companyInfo.rcsCity}
                onChange={(e) => setCompanyInfo({ ...companyInfo, rcsCity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Paris"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de TVA intracommunautaire
            </label>
            <input
              type="text"
              value={companyInfo.vatNumber}
              onChange={(e) => setCompanyInfo({ ...companyInfo, vatNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="FR12345678901"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: FR + 2 chiffres clés + SIREN (ex: FR12345678901)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capital social
              </label>
              <input
                type="text"
                value={companyInfo.capital}
                onChange={(e) => setCompanyInfo({ ...companyInfo, capital: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="10 000 €"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Directeur / Représentant légal
              </label>
              <input
                type="text"
                value={companyInfo.director}
                onChange={(e) => setCompanyInfo({ ...companyInfo, director: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nom Prénom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="123 Rue Example"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={companyInfo.postalCode}
                onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="75001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={companyInfo.city}
                onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays
              </label>
              <input
                type="text"
                value={companyInfo.country}
                onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="France"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="contact@entreprise.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-800">
              <strong>Conformité européenne :</strong> Ces informations seront automatiquement incluses dans vos devis et factures pour respecter la législation européenne (Directive 2011/83/UE, Directive TVA, RGPD).
            </p>
            <div className="mt-3 pt-3 border-t border-blue-300">
              <p className="text-sm font-semibold text-blue-900 mb-1">Réforme facturation électronique 2025-2027 :</p>
              <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                <li><strong>Juin 2025 :</strong> Choix de la solution de dématérialisation</li>
                <li><strong>Septembre 2026 :</strong> Réception obligatoire pour toutes les entreprises</li>
                <li><strong>Septembre 2026 :</strong> Émission obligatoire pour grandes entreprises et ETI</li>
                <li><strong>Septembre 2027 :</strong> Émission obligatoire pour TPE et micro-entreprises</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                FixTector génère automatiquement des factures électroniques au format UBL 2.1 (EN 16931) conformes à la réforme.
              </p>
            </div>
          </div>
        </div>
      </div>

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

      {/* SSL / HTTPS */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">SSL / HTTPS</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Activer SSL/HTTPS</p>
              <p className="text-sm text-gray-500">
                {sslStatus === 'checking' && 'Vérification du statut SSL...'}
                {sslStatus === 'active' && 'Certificat SSL actif et valide'}
                {sslStatus === 'inactive' && 'SSL non configuré ou certificat invalide'}
                {sslStatus === 'error' && 'Impossible de vérifier le statut SSL'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={sslEnabled}
                onChange={(e) => handleSslToggle(e.target.checked)}
                disabled={sslStatus === 'checking'}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 disabled:opacity-50"></div>
            </label>
          </div>

          {sslEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Forcer la redirection HTTPS</p>
                  <p className="text-sm text-gray-500">
                    Rediriger automatiquement toutes les requêtes HTTP vers HTTPS
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={forceHttps}
                    onChange={(e) => handleForceHttpsToggle(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Note :</strong> Pour activer SSL, vous devez d'abord configurer un certificat SSL sur votre serveur.
                </p>
                <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li>Utilisez Let's Encrypt avec Certbot pour obtenir un certificat gratuit</li>
                  <li>Commande : <code className="bg-blue-100 px-1 rounded">sudo certbot --nginx -d votre-domaine.com</code></li>
                  <li>Ou : <code className="bg-blue-100 px-1 rounded">sudo certbot --apache -d votre-domaine.com</code></li>
                </ul>
              </div>

              {sslStatus === 'active' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm font-medium text-green-800">
                      SSL actif - Votre site est sécurisé
                    </p>
                  </div>
                </div>
              )}

              {sslStatus === 'inactive' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Unlock className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm font-medium text-yellow-800">
                      SSL non configuré - Configurez un certificat SSL pour activer HTTPS
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
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

