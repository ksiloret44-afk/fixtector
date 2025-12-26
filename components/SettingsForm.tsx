'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Database, Shield, Receipt, Mail, MessageSquare, Building2, Upload, X, Image as ImageIcon, Lock, Unlock, Server, Send, CheckCircle, AlertCircle, Terminal, CreditCard, ChevronDown } from 'lucide-react'
import VHostConfig from './VHostConfig'

interface SettingsFormProps {
  userRole?: string
}

export default function SettingsForm({ userRole }: SettingsFormProps) {
  // Utiliser 'general' par défaut pour éviter les erreurs d'hydratation
  // Ne pas utiliser localStorage dans l'initialisation pour éviter les différences serveur/client
  const [activeTab, setActiveTab] = useState('general')
  const [isMounted, setIsMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])
  
  // Restaurer l'onglet actif depuis localStorage après le montage (uniquement côté client)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('settingsActiveTab')
      if (savedTab && savedTab !== activeTab) {
        // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
        requestAnimationFrame(() => {
          setActiveTab(savedTab)
        })
      }
    }
  }, [])
  
  // Sauvegarder l'onglet actif dans localStorage
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setMenuOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('settingsActiveTab', tabId)
    }
  }
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [taxRate, setTaxRate] = useState('20.0')
  const [companyType, setCompanyType] = useState('auto-entrepreneur')
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Debug: vérifier le rôle utilisateur
  useEffect(() => {
    console.log('SettingsForm - userRole:', userRole)
  }, [userRole])

  // Debug: vérifier le rôle utilisateur
  useEffect(() => {
    console.log('SettingsForm - userRole:', userRole)
  }, [userRole])
  
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
  const [smsAuthToken, setSmsAuthToken] = useState('')
  const [smsFrom, setSmsFrom] = useState('')
  const [smsSender, setSmsSender] = useState('') // Pour OVH: sender différent du service name
  const [smsConsumerKey, setSmsConsumerKey] = useState('') // Pour OVH Consumer Key
  const [smsTestNumber, setSmsTestNumber] = useState('')
  const [smsTestLoading, setSmsTestLoading] = useState(false)
  
  // Paramètres SSL
  const [sslEnabled, setSslEnabled] = useState(false)
  const [forceHttps, setForceHttps] = useState(false)
  const [sslStatus, setSslStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking')
  
  // Terminal/Logs
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(true)
  const [logsFilter, setLogsFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all')
  
  // Configuration Stripe
  const [stripePublishableKey, setStripePublishableKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('')
  const [stripeActive, setStripeActive] = useState(false)

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

  // Charger les logs du terminal
  const loadLogs = async () => {
    if (!userRole || userRole !== 'admin') return
    
    setLogsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('count', '500')
      if (logsFilter !== 'all') {
        params.append('level', logsFilter)
      }
      
      const response = await fetch(`/api/logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err)
    } finally {
      setLogsLoading(false)
    }
  }

  // Auto-refresh des logs
  useEffect(() => {
    if (activeTab === 'terminal' && logsAutoRefresh && userRole === 'admin') {
      loadLogs()
      const interval = setInterval(loadLogs, 2000) // Rafraîchir toutes les 2 secondes
      return () => clearInterval(interval)
    }
  }, [activeTab, logsAutoRefresh, logsFilter, userRole])

  // Charger les logs quand on change d'onglet vers terminal
  useEffect(() => {
    if (activeTab === 'terminal' && userRole === 'admin') {
      loadLogs()
    }
  }, [activeTab, userRole])

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
        if (data.settings?.smsAuthToken) setSmsAuthToken(data.settings.smsAuthToken)
        if (data.settings?.smsFrom) setSmsFrom(data.settings.smsFrom)
        if (data.settings?.smsConsumerKey) setSmsConsumerKey(data.settings.smsConsumerKey)
        if (data.settings?.smsSender) setSmsSender(data.settings.smsSender)
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
    
    // Charger la configuration Stripe (uniquement pour les admins)
    if (userRole === 'admin') {
      fetch('/api/stripe/config')
        .then(res => res.json())
        .then(data => {
          if (data.config) {
            setStripePublishableKey(data.config.publishableKey || '')
            // Ne pas afficher les clés secrètes si elles sont déjà configurées
            setStripeSecretKey(data.config.hasSecretKey ? '' : (data.config.secretKey || ''))
            setStripeWebhookSecret(data.config.hasWebhookSecret ? '' : (data.config.webhookSecret || ''))
            setStripeActive(data.config.isActive || false)
          }
        })
        .catch(err => {
          console.error('Erreur lors du chargement de la config Stripe:', err)
        })
    }
  }, [userRole])
  
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

  const handleSmsTest = async () => {
    if (!smsTestNumber || !smsTestNumber.trim()) {
      setSuccess('Veuillez entrer un numéro de téléphone')
      setTimeout(() => setSuccess(''), 3000)
      return
    }

    if (!smsEnabled) {
      setSuccess('Veuillez d\'abord activer les notifications SMS')
      setTimeout(() => setSuccess(''), 3000)
      return
    }

    if (!smsProvider || !smsApiKey) {
      setSuccess('Veuillez configurer le fournisseur SMS et la clé API')
      setTimeout(() => setSuccess(''), 3000)
      return
    }

    if (smsProvider === 'twilio' && !smsAuthToken) {
      setSuccess('Veuillez configurer l\'Auth Token pour Twilio')
      setTimeout(() => setSuccess(''), 3000)
      return
    }

    setSmsTestLoading(true)
    setSuccess('')

    try {
      const response = await fetch('/api/settings/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: smsTestNumber.trim(),
          provider: smsProvider,
          apiKey: smsApiKey,
          authToken: smsAuthToken,
          from: smsFrom,
          consumerKey: smsConsumerKey,
          sender: smsSender,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('✅ SMS de test envoyé avec succès ! Vérifiez votre téléphone.')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorMsg = data.error || 'Erreur lors de l\'envoi du SMS de test'
        let detailsText = ''
        
        if (data.details) {
          if (typeof data.details === 'string') {
            detailsText = `\n\nDétails: ${data.details}`
          } else if (typeof data.details === 'object') {
            // Formater l'objet détails de manière lisible
            const detailsParts: string[] = []
            
            if (data.details.provider) {
              detailsParts.push(`Fournisseur: ${data.details.provider}`)
            }
            if (data.details.apiKey !== undefined) {
              const apiKeyValue = data.details.apiKey === 'présent' ? '✓ Présent' : 
                                 data.details.apiKey === 'manquant' ? '✗ Manquant' : 
                                 data.details.apiKey
              detailsParts.push(`Clé API: ${apiKeyValue}`)
            }
            if (data.details.authToken !== undefined) {
              const authTokenValue = data.details.authToken === 'présent' ? '✓ Présent' : 
                                    data.details.authToken === 'manquant' ? '✗ Manquant' : 
                                    data.details.authToken
              detailsParts.push(`Auth Token: ${authTokenValue}`)
            }
            if (data.details.from !== undefined) {
              const fromValue = data.details.from === 'manquant' ? '✗ Manquant' : data.details.from
              detailsParts.push(`Expéditeur: ${fromValue}`)
            }
            if (data.details.consumerKey !== undefined && data.details.provider === 'ovh') {
              const consumerKeyValue = data.details.consumerKey === 'présent' ? '✓ Présent' : 
                                      data.details.consumerKey === 'manquant ou vide' ? '✗ Manquant ou vide' : 
                                      data.details.consumerKey
              detailsParts.push(`Consumer Key: ${consumerKeyValue}`)
            }
            
            // Afficher l'erreur Twilio en premier si disponible (c'est le plus important)
            if (data.details.twilioError) {
              detailsParts.push('') // Ligne vide pour séparer
              detailsParts.push('=== Erreur Twilio ===')
              const twilioErr = data.details.twilioError
              if (twilioErr.code) {
                detailsParts.push(`Code: ${twilioErr.code}`)
              }
              if (twilioErr.message) {
                detailsParts.push(`Message: ${twilioErr.message}`)
              }
              if (twilioErr.status) {
                detailsParts.push(`Status HTTP: ${twilioErr.status}`)
              }
              if (twilioErr.moreInfo) {
                detailsParts.push(`Plus d'infos: ${twilioErr.moreInfo}`)
              }
              
              // Ajouter des instructions spécifiques pour l'erreur 21608
              if (twilioErr.code === '21608' || twilioErr.code === 21608) {
                detailsParts.push('') // Ligne vide
                detailsParts.push('=== Solution ===')
                detailsParts.push('Vous utilisez un compte Twilio Trial.')
                detailsParts.push('Options:')
                detailsParts.push('1. Vérifier le numéro de destination dans la console Twilio:')
                detailsParts.push('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified')
                detailsParts.push('2. Ou passer à un compte payant pour envoyer à n\'importe quel numéro:')
                detailsParts.push('   https://console.twilio.com/billing')
              }
            }
            
            // Afficher aussi le message général si présent
            if (data.details.message && !data.details.twilioError) {
              detailsParts.push('') // Ligne vide pour séparer
              detailsParts.push(`Note: ${data.details.message}`)
            }
            
            if (data.details.originalError) {
              if (!data.details.twilioError) {
                detailsParts.push('') // Ligne vide pour séparer
              }
              detailsParts.push(`Erreur originale: ${data.details.originalError}`)
            }
            
            if (detailsParts.length > 0) {
              detailsText = `\n\n${detailsParts.join('\n')}`
            }
          }
        }
        
        // Si pas de détails mais qu'on a une erreur, afficher au moins le message d'erreur
        if (!detailsText && data.error) {
          detailsText = `\n\nMessage: ${data.error}`
        }
        
        setSuccess(`❌ ${errorMsg}${detailsText}`)
        setTimeout(() => setSuccess(''), 10000)
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setSuccess('Erreur lors de l\'envoi du SMS de test: ' + (err.message || 'Erreur inconnue'))
      setTimeout(() => setSuccess(''), 5000)
    } finally {
      setSmsTestLoading(false)
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
          smsAuthToken: smsAuthToken,
          smsFrom,
          smsConsumerKey: smsConsumerKey || undefined,
          smsSender: smsSender || undefined,
          sslEnabled: sslEnabled.toString(),
          forceHttps: forceHttps.toString(),
        }),
      })

      // Sauvegarder la configuration Stripe (uniquement pour les admins)
      if (userRole === 'admin') {
        await fetch('/api/stripe/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publishableKey: stripePublishableKey,
            secretKey: stripeSecretKey,
            webhookSecret: stripeWebhookSecret,
            isActive: stripeActive,
          }),
        })
      }

      // Sauvegarder les informations de l'entreprise
      const companyResponse = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyInfo),
      })

      const settingsData = await settingsResponse.json()
      const companyData = companyResponse.ok ? await companyResponse.json() : { error: 'Erreur lors de la sauvegarde des informations de l\'entreprise' }
      
      if (settingsResponse.ok && companyResponse.ok) {
        setSuccess('Paramètres enregistrés avec succès')
        setTimeout(() => setSuccess(''), 3000)
        // Recharger les paramètres sans recharger toute la page
        // On recharge juste les données nécessaires
        const reloadSettings = async () => {
          try {
            const response = await fetch('/api/settings')
            const data = await response.json()
            if (data.settings) {
              if (data.settings.taxRate) setTaxRate(data.settings.taxRate)
              if (data.settings.companyType) setCompanyType(data.settings.companyType)
              if (data.settings.emailEnabled !== undefined) setEmailEnabled(data.settings.emailEnabled === 'true')
              if (data.settings.smsEnabled !== undefined) setSmsEnabled(data.settings.smsEnabled === 'true')
              if (data.settings.smtpHost) setSmtpHost(data.settings.smtpHost)
              if (data.settings.smtpPort) setSmtpPort(data.settings.smtpPort)
              if (data.settings.smtpUser) setSmtpUser(data.settings.smtpUser)
              if (data.settings.smtpFrom) setSmtpFrom(data.settings.smtpFrom)
              if (data.settings.smsProvider) setSmsProvider(data.settings.smsProvider)
              if (data.settings.smsFrom) setSmsFrom(data.settings.smsFrom)
              if (data.settings.sslEnabled !== undefined) setSslEnabled(data.settings.sslEnabled === 'true')
              if (data.settings.forceHttps !== undefined) setForceHttps(data.settings.forceHttps === 'true')
            }
          } catch (err) {
            console.error('Erreur lors du rechargement des paramètres:', err)
          }
        }
        reloadSettings()
      } else {
        const errorMsg = settingsData.error || companyData.error || 'Erreur lors de l\'enregistrement'
        console.error('[SettingsForm] Erreur de sauvegarde:', {
          settingsResponse: settingsResponse.status,
          companyResponse: companyResponse.status,
          settingsData,
          companyData,
        })
        setSuccess(errorMsg)
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setSuccess('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(userRole === 'admin' ? [{ id: 'stripe', label: 'Stripe', icon: CreditCard }] : []),
    ...(userRole === 'admin' ? [{ id: 'ssl', label: 'SSL/HTTPS', icon: Lock }] : []),
    { id: 'database', label: 'Base de données', icon: Database },
    { id: 'security', label: 'Sécurité', icon: Shield },
    ...(userRole === 'admin' ? [{ id: 'vhost', label: 'Virtual Host', icon: Server }] : []),
    ...(userRole === 'admin' ? [{ id: 'terminal', label: 'Terminal', icon: Terminal }] : []),
  ].filter(Boolean) // S'assurer que tous les éléments sont valides

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Menu déroulant pour les onglets */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-4">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
            >
              <div className="flex items-center">
                {(() => {
                  const currentTab = tabs.find(t => t.id === activeTab)
                  const Icon = currentTab?.icon || Building2
                  return (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      <span>{currentTab?.label || 'Général'}</span>
                    </>
                  )
                })()}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {menuOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        w-full flex items-center px-4 py-3 text-sm font-medium transition-colors
                        ${activeTab === tab.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span>{tab.label}</span>
                      {activeTab === tab.id && (
                        <CheckCircle className="h-4 w-4 ml-auto text-primary-600 dark:text-primary-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'vhost' && userRole === 'admin' && (
        <VHostConfig />
      )}

      {activeTab === 'terminal' && userRole === 'admin' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Terminal className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Terminal - Logs du serveur</h2>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={logsFilter}
                onChange={(e) => setLogsFilter(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tous les logs</option>
                <option value="info">Info</option>
                <option value="warn">Avertissements</option>
                <option value="error">Erreurs</option>
                <option value="debug">Debug</option>
              </select>
              <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={logsAutoRefresh}
                  onChange={(e) => setLogsAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh
              </label>
              <button
                onClick={loadLogs}
                disabled={logsLoading}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {logsLoading ? 'Chargement...' : 'Actualiser'}
              </button>
              <button
                onClick={async () => {
                  if (confirm('Voulez-vous vraiment vider tous les logs ?')) {
                    try {
                      const response = await fetch('/api/logs', { method: 'DELETE' })
                      if (response.ok) {
                        setLogs([])
                        setSuccess('Logs vidés avec succès')
                        setTimeout(() => setSuccess(''), 3000)
                      }
                    } catch (err) {
                      console.error('Erreur lors du vidage des logs:', err)
                    }
                  }
                }}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                Vider
              </button>
            </div>
          </div>

          <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm overflow-auto max-h-[600px]">
            {logs.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">
                {logsLoading ? 'Chargement des logs...' : 'Aucun log disponible'}
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => {
                  const timestamp = new Date(log.timestamp).toLocaleTimeString('fr-FR')
                  const levelColors = {
                    info: 'text-blue-400',
                    warn: 'text-yellow-400',
                    error: 'text-red-400',
                    debug: 'text-gray-400',
                  }
                  const levelColor = levelColors[log.level as keyof typeof levelColors] || 'text-gray-300'

                  return (
                    <div key={index} className="flex items-start">
                      <span className="text-gray-500 dark:text-gray-600 mr-3 min-w-[80px]">
                        {timestamp}
                      </span>
                      <span className={`min-w-[60px] font-bold ${levelColor}`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-gray-300 dark:text-gray-400 flex-1">
                        {log.message}
                        {log.data && (
                          <span className="text-gray-500 dark:text-gray-600 ml-2">
                            {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <p>Total: {logs.length} logs affichés</p>
            <p className="mt-1">Les logs sont automatiquement mis à jour toutes les 2 secondes lorsque l'auto-refresh est activé.</p>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <>
      {/* Logo de l'entreprise */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ImageIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Logo de l'entreprise</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                  <Upload className="h-8 w-8 mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, SVG ou WebP (MAX. 5MB)</p>
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
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Upload en cours...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations légales de l'entreprise */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Informations légales de l'entreprise</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: FR + 2 chiffres clés + SIREN (ex: FR12345678901)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

      {/* Fiscalité */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Receipt className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Fiscalité</h2>
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
        </>
      )}

      {activeTab === 'notifications' && (
        <>
      {/* Notifications Email */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Mail className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notifications Email</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Activer les notifications email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Envoyer automatiquement des emails aux clients à chaque étape</p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe SMTP
                </label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Mot de passe ou token d'application"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pour Gmail, utilisez un mot de passe d'application
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications SMS */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notifications SMS</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Activer les notifications SMS</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Envoyer automatiquement des SMS aux clients à chaque étape</p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fournisseur SMS
                </label>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="twilio">Twilio</option>
                  <option value="ovh">OVH</option>
                  <option value="smsapi">SMSAPI</option>
                  <option value="custom">API personnalisée</option>
                </select>
              </div>
              {smsProvider === 'custom' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL de l'API personnalisée
                  </label>
                  <input
                    type="url"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://api.example.com/sms"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    L'API doit accepter POST avec {"{"}"to": "numéro", "message": "texte", "from": "expéditeur"{"}"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {smsProvider === 'twilio' 
                        ? 'Account SID' 
                        : smsProvider === 'smsapi' 
                        ? 'API Key SMSAPI' 
                        : smsProvider === 'ovh'
                        ? 'Application Key OVH'
                        : 'Clé API'}
                    </label>
                    <input
                      type="text"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={
                        smsProvider === 'twilio' 
                          ? 'ACxxxxxxxxxxxxx' 
                          : smsProvider === 'smsapi' 
                          ? 'Votre clé API SMSAPI' 
                          : smsProvider === 'ovh'
                          ? 'Votre Application Key OVH'
                          : 'Votre clé API'
                      }
                    />
                    {smsProvider === 'smsapi' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Vous pouvez obtenir votre clé API sur <a href="https://www.smsapi.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">smsapi.com</a>
                      </p>
                    )}
                    {smsProvider === 'ovh' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Obtenez vos identifiants API sur <a href="https://eu.api.ovh.com/createToken/" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">console OVH</a>. Vous avez besoin de l'Application Key.
                      </p>
                    )}
                  </div>
                  {(smsProvider === 'twilio' || smsProvider === 'ovh') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {smsProvider === 'twilio' ? 'Auth Token' : 'Application Secret OVH'}
                      </label>
                      <input
                        type="password"
                        value={smsAuthToken}
                        onChange={(e) => setSmsAuthToken(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={
                          smsProvider === 'twilio' 
                            ? 'Votre Auth Token Twilio' 
                            : 'Votre Application Secret OVH'
                        }
                      />
                      {smsProvider === 'twilio' && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Vous pouvez trouver votre Auth Token dans votre <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">console Twilio</a>
                        </p>
                      )}
                      {smsProvider === 'ovh' && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Application Secret obtenu lors de la création du token sur <a href="https://eu.api.ovh.com/createToken/" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">console OVH</a>.
                        </p>
                      )}
                    </div>
                  )}
                  {smsProvider === 'ovh' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Consumer Key OVH
                      </label>
                      <input
                        type="password"
                        value={smsConsumerKey}
                        onChange={(e) => setSmsConsumerKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Votre Consumer Key OVH"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Consumer Key obtenu lors de la création du token sur <a href="https://eu.api.ovh.com/createToken/" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">console OVH</a>. C'est le troisième identifiant après Application Key et Application Secret.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {smsProvider === 'smsapi' 
                    ? 'Nom d\'expéditeur' 
                    : smsProvider === 'ovh'
                    ? 'Service Name OVH'
                    : 'Numéro expéditeur'}
                </label>
                <input
                  type="text"
                  value={smsFrom}
                  onChange={(e) => setSmsFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={
                    smsProvider === 'smsapi' 
                      ? 'FixTector' 
                      : smsProvider === 'ovh'
                      ? 'sms-xxxxx-1'
                      : '+33612345678'
                  }
                />
                {smsProvider === 'smsapi' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Nom d'expéditeur (jusqu'à 11 caractères) ou numéro de téléphone
                  </p>
                )}
                {smsProvider === 'ovh' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Le Service Name est le nom de votre compte SMS OVH (ex: sms-xxxxx-1). Vous le trouvez dans votre <a href="https://www.ovh.com/manager/telecom/#/sms" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">espace client OVH</a>.
                  </p>
                )}
                {smsProvider === 'ovh' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expéditeur OVH (Sender) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smsSender}
                      onChange={(e) => setSmsSender(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ex: FixTector ou +33612345678"
                    />
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                        ⚠️ Important : L'expéditeur est obligatoire !
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                        Sans expéditeur, les SMS ne pourront pas être envoyés. Vous avez 3 options :
                      </p>
                      <ol className="text-xs text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
                        <li><strong>Recommandé :</strong> Créez un nom d'expéditeur professionnel dans OVH (ex: "FixTector")</li>
                        <li><strong>Alternative :</strong> Utilisez un numéro de téléphone vérifié (ex: +33612345678)</li>
                        <li><strong>Si déjà créé :</strong> Utilisez votre Service Name comme expéditeur (doit être créé dans OVH)</li>
                      </ol>
                      <a 
                        href={`https://www.ovh.com/manager/telecom/#/sms/${smsFrom || 'votre-service'}/senders`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold mt-2 inline-block"
                      >
                        → Créer un expéditeur dans OVH maintenant
                      </a>
                    </div>
                  </div>
                )}
                {smsProvider === 'ovh' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expéditeur OVH (Sender) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smsSender}
                      onChange={(e) => setSmsSender(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ex: FixTector ou +33612345678"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <strong>Recommandé:</strong> Créez un nom d'expéditeur professionnel dans OVH (ex: "FixTector", "MonEntreprise"). 
                      <br />
                      <strong>Alternative:</strong> Utilisez un numéro de téléphone vérifié (les SMS partiront de ce numéro).
                      <br />
                      <a href={`https://www.ovh.com/manager/telecom/#/sms/${smsFrom || 'votre-service'}/senders`} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        Créer un expéditeur dans OVH →
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Test SMS */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Tester la configuration SMS
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Numéro de téléphone de test
                    </label>
                    <input
                      type="tel"
                      value={smsTestNumber}
                      onChange={(e) => setSmsTestNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+33612345678"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSmsTest}
                      disabled={smsTestLoading || !smsEnabled}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {smsTestLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Tester SMS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Un SMS de test sera envoyé au numéro indiqué pour vérifier que la configuration fonctionne correctement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === 'stripe' && userRole === 'admin' && (
        <>
      {/* Configuration Stripe */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration Stripe</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Activer Stripe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activez Stripe pour permettre les paiements en ligne</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={stripeActive}
                onChange={(e) => setStripeActive(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {stripeActive && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clé publique Stripe (Publishable Key)
                </label>
                <input
                  type="text"
                  value={stripePublishableKey}
                  onChange={(e) => setStripePublishableKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="pk_test_..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Commence par <code className="bg-gray-100 px-1 rounded">pk_test_</code> (test) ou <code className="bg-gray-100 px-1 rounded">pk_live_</code> (production)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clé secrète Stripe (Secret Key)
                </label>
                <input
                  type="password"
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="sk_test_... (laisser vide pour conserver la valeur actuelle)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Commence par <code className="bg-gray-100 px-1 rounded">sk_test_</code> (test) ou <code className="bg-gray-100 px-1 rounded">sk_live_</code> (production). 
                  Laissez vide pour conserver la valeur actuelle.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secret du webhook Stripe (Webhook Secret)
                </label>
                <input
                  type="password"
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="whsec_... (laisser vide pour conserver la valeur actuelle)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Commence par <code className="bg-gray-100 px-1 rounded">whsec_</code>. Obtenez-le depuis votre tableau de bord Stripe &gt; Développeurs &gt; Webhooks.
                  Laissez vide pour conserver la valeur actuelle.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Ces clés sont stockées de manière sécurisée dans la base de données. 
                  Pour tester en local, utilisez Stripe CLI : <code className="bg-blue-100 px-1 rounded">stripe listen --forward-to localhost:3001/api/stripe/webhook</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === 'database' && (
        <>
      {/* Base de données */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Base de données</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Type de base de données: <span className="font-medium">SQLite</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              La base de données est stockée localement dans le fichier dev.db
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => window.open('/api/db/backup', '_blank')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Sauvegarder la base de données
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'ssl' && userRole === 'admin' && (
        <>
      {/* SSL / HTTPS */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Lock className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">SSL / HTTPS</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Activer SSL/HTTPS</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
        </>
      )}

      {activeTab === 'security' && (
        <>
      {/* Sécurité */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sécurité</h2>
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
        </>
      )}

      {/* Messages de succès/erreur et bouton de sauvegarde */}
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

