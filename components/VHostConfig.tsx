'use client'

import { useState, useEffect } from 'react'
import { Server, Globe, FileText, Download, CheckCircle, XCircle, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react'

interface VHostConfig {
  domain: string
  serverType: 'apache' | 'nginx'
  documentRoot: string
  port: number
  sslEnabled: boolean
  sslCertPath?: string
  sslKeyPath?: string
  redirectHttp: boolean
  phpVersion?: string
  serverAlias?: string[]
  customConfig?: string
  useReverseProxy: boolean
  proxyTarget?: string
  useCloudflare: boolean
  cloudflareTunnelId?: string
  cloudflareTunnelName?: string
}

export default function VHostConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [configPreview, setConfigPreview] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [cloudflareStatus, setCloudflareStatus] = useState<any>(null)
  const [cloudflareLoading, setCloudflareLoading] = useState(false)
  const [isWindows, setIsWindows] = useState(false)

  const [config, setConfig] = useState<VHostConfig>({
    domain: '',
    serverType: 'apache',
    documentRoot: '/var/www/html', // Valeur par défaut, sera mise à jour côté client
    port: 80,
    sslEnabled: false,
    redirectHttp: true,
    phpVersion: '8.1',
    serverAlias: [],
    customConfig: '',
    useReverseProxy: true,
    proxyTarget: 'http://localhost:3001',
    useCloudflare: false,
    cloudflareTunnelId: '',
    cloudflareTunnelName: 'fixtector',
  })

  useEffect(() => {
    // Détecter la plateforme côté client uniquement
    if (typeof window !== 'undefined') {
      const platform = window.navigator.platform.toLowerCase()
      const windows = platform.includes('win')
      setIsWindows(windows)
      
      // Mettre à jour le documentRoot si Windows
      if (windows) {
        setConfig(prev => ({
          ...prev,
          documentRoot: 'C:/Apache24/htdocs/fixtector'
        }))
      }
    }
    
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadConfig(), loadBaseUrl(), loadCloudflareStatus()])
    } catch (err) {
      console.error('[VHostConfig] Erreur lors du chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCloudflareStatus = async (showSuccess = false) => {
    setCloudflareLoading(true)
    try {
      const response = await fetch('/api/cloudflare', {
        cache: 'no-store', // Forcer le rafraîchissement
      })
      if (response.ok) {
        const data = await response.json()
        setCloudflareStatus(data)
        console.log('[VHostConfig] Statut Cloudflare mis à jour:', data)
        if (showSuccess) {
          setSuccess('Statut Cloudflare actualisé')
          setTimeout(() => setSuccess(''), 2000)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[VHostConfig] Erreur API Cloudflare:', response.status, errorData)
        setError('Erreur lors du chargement du statut Cloudflare')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err: any) {
      console.error('[VHostConfig] Erreur lors du chargement du statut Cloudflare:', err)
      setError('Erreur: ' + (err.message || 'Erreur inconnue'))
      setTimeout(() => setError(''), 5000)
    } finally {
      setCloudflareLoading(false)
    }
  }

  const handleCloudflareAction = async (action: 'start' | 'stop' | 'restart') => {
    setCloudflareLoading(true)
    try {
      const response = await fetch('/api/cloudflare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tunnelName: config.cloudflareTunnelName || 'fixtector',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || `Tunnel ${action === 'start' ? 'démarré' : action === 'stop' ? 'arrêté' : 'redémarré'} avec succès`)
        setTimeout(() => setSuccess(''), 3000)
        // Recharger le statut
        await loadCloudflareStatus()
      } else {
        setError(data.error || `Erreur lors de l'${action === 'start' ? 'démarrage' : action === 'stop' ? 'arrêt' : 'redémarrage'}`)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err: any) {
      console.error('[VHostConfig] Erreur action Cloudflare:', err)
      setError(`Erreur: ${err.message || 'Erreur inconnue'}`)
      setTimeout(() => setError(''), 5000)
    } finally {
      setCloudflareLoading(false)
    }
  }

  const loadBaseUrl = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        console.log('[VHostConfig] URL de base chargée:', data.settings?.baseUrl)
        if (data.settings?.baseUrl) {
          setBaseUrl(data.settings.baseUrl)
        } else {
          // Utiliser l'origine de la page comme valeur par défaut
          const defaultUrl = typeof window !== 'undefined' 
            ? window.location.origin
            : 'http://localhost:3001'
          setBaseUrl(defaultUrl)
        }
      }
    } catch (err) {
      console.error('[VHostConfig] Erreur lors du chargement de l\'URL de base:', err)
      // Utiliser l'origine de la page comme fallback
      if (typeof window !== 'undefined') {
        setBaseUrl(window.location.origin)
      }
    }
  }

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/vhost')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          console.log('[VHostConfig] Configuration chargée:', data.config)
          setConfig(data.config)
        }
      }
    } catch (err) {
      console.error('[VHostConfig] Erreur lors du chargement de la config:', err)
    }
  }

  const handleDomainChange = (domain: string) => {
    setError('')
    setConfig({ ...config, domain })
  }

  const generateConfig = async () => {
    if (!config.domain || config.domain.trim() === '') {
      setError('Veuillez saisir un nom de domaine')
      return
    }

    setGenerating(true)
    setError('')
    setConfigPreview('')

    try {
      const response = await fetch('/api/vhost/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        setConfigPreview(data.config)
        setSuccess('Configuration générée avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Erreur lors de la génération')
      }
    } catch (err: any) {
      setError('Erreur lors de la génération de la configuration: ' + (err.message || 'Erreur inconnue'))
    } finally {
      setGenerating(false)
    }
  }

  const testConfig = async () => {
    if (!config.domain || config.domain.trim() === '') {
      setError('Veuillez saisir un nom de domaine')
      return
    }

    setTesting(true)
    setError('')
    setTestResult(null)

    try {
      const response = await fetch('/api/vhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult(data)
        setSuccess('Test de configuration terminé')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Erreur lors du test')
      }
    } catch (err: any) {
      setError('Erreur lors du test de la configuration: ' + (err.message || 'Erreur inconnue'))
    } finally {
      setTesting(false)
    }
  }

  const saveConfig = async () => {
    // Permettre de sauvegarder uniquement le baseUrl même sans domaine
    if (!baseUrl || !baseUrl.trim()) {
      setError('Veuillez saisir une URL de base')
      return
    }

    if (!config.domain || config.domain.trim() === '') {
      setError('Veuillez saisir un nom de domaine')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const errors: string[] = []
    const successes: string[] = []

    // 1. Sauvegarder l'URL de base (toujours sauvegarder si rempli)
    if (baseUrl && baseUrl.trim()) {
      try {
        let normalizedBaseUrl = baseUrl.trim()
        if (!normalizedBaseUrl.match(/^https?:\/\//i)) {
          normalizedBaseUrl = `http://${normalizedBaseUrl}`
        }

        console.log('[VHostConfig] ===== DEBUT SAUVEGARDE BASEURL =====')
        console.log('[VHostConfig] URL normalisée à sauvegarder:', normalizedBaseUrl)
        console.log('[VHostConfig] Envoi de la requête POST à /api/settings avec baseUrl:', normalizedBaseUrl)

        const settingsResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl: normalizedBaseUrl }),
        })

        console.log('[VHostConfig] Réponse reçue, status:', settingsResponse.status, settingsResponse.ok)
        const settingsData = await settingsResponse.json()
        console.log('[VHostConfig] Données de réponse:', settingsData)

        if (settingsResponse.ok) {
          console.log('[VHostConfig] ✓ URL de base sauvegardée avec succès!')
          console.log('[VHostConfig] Réponse complète:', JSON.stringify(settingsData, null, 2))
          successes.push('URL de base sauvegardée')
          
          // Mettre à jour immédiatement avec la valeur retournée par l'API
          if (settingsData.savedBaseUrl || settingsData.baseUrl) {
            const savedUrl = settingsData.savedBaseUrl || settingsData.baseUrl
            console.log('[VHostConfig] Mise à jour de l\'URL avec la valeur retournée:', savedUrl)
            setBaseUrl(savedUrl)
          } else {
            // Sinon, recharger depuis l'API
            await loadBaseUrl()
          }
        } else {
          const errorMsg = settingsData.error || 'Erreur inconnue'
          console.error('[VHostConfig] ✗ ERREUR lors de la sauvegarde de l\'URL de base')
          console.error('[VHostConfig] Status:', settingsResponse.status)
          console.error('[VHostConfig] Message d\'erreur:', errorMsg)
          console.error('[VHostConfig] Réponse complète:', JSON.stringify(settingsData, null, 2))
          errors.push(`URL de base: ${errorMsg}`)
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Erreur inconnue'
        console.error('[VHostConfig] ✗ EXCEPTION lors de la sauvegarde de l\'URL de base')
        console.error('[VHostConfig] Erreur:', err)
        console.error('[VHostConfig] Stack:', err.stack)
        errors.push(`URL de base: ${errorMsg}`)
      }
    } else {
      console.warn('[VHostConfig] ⚠️ baseUrl est vide ou non défini, pas de sauvegarde')
      console.warn('[VHostConfig] Valeur de baseUrl:', baseUrl)
    }

    // 2. Sauvegarder la configuration Virtual Host
    try {
      console.log('[VHostConfig] Sauvegarde de la config VHost:', config)

      const vhostResponse = await fetch('/api/vhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const vhostData = await vhostResponse.json()

      if (vhostResponse.ok) {
        console.log('[VHostConfig] Config VHost sauvegardée:', vhostData)
        successes.push('Configuration Virtual Host sauvegardée')
      } else {
        const errorMsg = vhostData.error || 'Erreur inconnue'
        console.error('[VHostConfig] Erreur VHost:', errorMsg)
        errors.push(`Virtual Host: ${errorMsg}`)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue'
      console.error('[VHostConfig] Erreur VHost:', err)
      errors.push(`Virtual Host: ${errorMsg}`)
    }

    // 3. Afficher les résultats
    if (errors.length === 0) {
      setSuccess(successes.join(', ') + '. Redémarrez le serveur pour appliquer les changements.')
      setTimeout(() => setSuccess(''), 5000)
    } else if (successes.length > 0) {
      setSuccess(successes.join(', '))
      setError('Erreurs: ' + errors.join(', '))
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 5000)
    } else {
      setError('Erreurs: ' + errors.join(', '))
    }

    setSaving(false)
  }

  const applyConfig = async () => {
    if (!configPreview) {
      setError('Générez d\'abord la configuration')
      return
    }

    if (!confirm('Cette action va créer/modifier le fichier de configuration du serveur. Continuer ?')) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/vhost/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          configContent: configPreview,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Configuration appliquée avec succès. Redémarrez votre serveur web.')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.error || 'Erreur lors de l\'application')
      }
    } catch (err: any) {
      setError('Erreur lors de l\'application de la configuration: ' + (err.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const downloadConfig = () => {
    if (!configPreview) {
      setError('Générez d\'abord la configuration')
      return
    }

    const filename = `${config.domain}.conf`
    const blob = new Blob([configPreview], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setSuccess('Configuration téléchargée')
    setTimeout(() => setSuccess(''), 3000)
  }

  const copyToClipboard = () => {
    if (!configPreview) return

    navigator.clipboard.writeText(configPreview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addServerAlias = () => {
    const alias = prompt('Entrez un alias de serveur (ex: www.example.com):')
    if (alias && alias.trim()) {
      setConfig({
        ...config,
        serverAlias: [...(config.serverAlias || []), alias.trim()],
      })
    }
  }

  const removeServerAlias = (index: number) => {
    const newAliases = [...(config.serverAlias || [])]
    newAliases.splice(index, 1)
    setConfig({ ...config, serverAlias: newAliases })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message d'alerte si baseUrl n'est pas configuré */}
      {(!baseUrl || baseUrl.includes('localhost')) && (
        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                ⚠️ URL de base non configurée
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                L'URL de base de l'application n'est pas encore configurée. Cela signifie que tous les liens et emails 
                utiliseront "localhost" au lieu de votre domaine public.
              </p>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                👉 <strong>Action requise:</strong> Remplissez le champ "URL de base de l'application" ci-dessous avec 
                votre domaine ou IP publique (ex: https://votre-domaine.com ou http://192.168.1.100:3001) 
                et cliquez sur "Enregistrer".
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Configuration de base */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Server className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration Virtual Host</h2>
        </div>

        <div className="space-y-4">
          {/* Nom de domaine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom de domaine <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.domain}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="example.com ou 192.168.1.1"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Le nom de domaine ou l'adresse IP pour votre application
            </p>
          </div>

          {/* URL de base de l'application */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de base de l'application <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="http://example.com ou https://example.com"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Cette URL remplacera "localhost" partout dans l'application (emails, liens, etc.)
            </p>
            {(!baseUrl || baseUrl.includes('localhost')) && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Attention:</strong> L'URL de base n'est pas encore configurée ou utilise encore "localhost". 
                  Veuillez remplir ce champ avec votre nom de domaine ou IP publique (ex: https://votre-domaine.com) 
                  et cliquer sur "Enregistrer" pour sauvegarder.
                </p>
              </div>
            )}
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Important: Après modification, redémarrez le serveur pour que les changements prennent effet.
            </p>
          </div>

          {/* Type de serveur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de serveur web
            </label>
            <select
              value={config.serverType}
              onChange={(e) => setConfig({ ...config, serverType: e.target.value as 'apache' | 'nginx' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="apache">Apache</option>
              <option value="nginx">Nginx</option>
            </select>
          </div>

          {/* Reverse Proxy */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Utiliser Reverse Proxy vers Node.js</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recommandé pour Next.js - Apache/Nginx redirige vers Node.js</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.useReverseProxy}
                  onChange={(e) => setConfig({ ...config, useReverseProxy: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            {config.useReverseProxy && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL cible (Node.js)
                </label>
                <input
                  type="text"
                  value={config.proxyTarget || 'http://localhost:3001'}
                  onChange={(e) => setConfig({ ...config, proxyTarget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="http://localhost:3001"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  URL complète vers votre serveur Node.js Next.js
                </p>
              </div>
            )}
          </div>

          {/* Document Root (seulement si pas de reverse proxy) */}
          {!config.useReverseProxy && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Root (chemin absolu) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.documentRoot}
                onChange={(e) => setConfig({ ...config, documentRoot: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={isWindows ? 'C:/Apache24/htdocs/fixtector' : '/var/www/html/weqeep-test'}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Chemin absolu vers le dossier de votre application
              </p>
            </div>
          )}

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 80 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="1"
              max="65535"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Port HTTP (80) ou HTTPS (443) selon votre configuration SSL
            </p>
          </div>

          {/* Server Aliases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alias de serveur (optionnel)
            </label>
            <div className="space-y-2">
              {config.serverAlias && config.serverAlias.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {config.serverAlias.map((alias, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      {alias}
                      <button
                        onClick={() => removeServerAlias(index)}
                        className="ml-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={addServerAlias}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                + Ajouter un alias
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Exemple: www.example.com, app.example.com
            </p>
          </div>
        </div>
      </div>

      {/* Configuration SSL */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration SSL/HTTPS</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Activer SSL/HTTPS</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configurer un certificat SSL pour votre domaine</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.sslEnabled}
                onChange={(e) => {
                  const sslEnabled = e.target.checked
                  setConfig({
                    ...config,
                    sslEnabled,
                    port: sslEnabled ? 443 : 80,
                  })
                }}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.sslEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chemin du certificat SSL
                </label>
                <input
                  type="text"
                  value={config.sslCertPath || ''}
                  onChange={(e) => setConfig({ ...config, sslCertPath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="/etc/letsencrypt/live/example.com/fullchain.pem"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Chemin vers le fichier de certificat (fullchain.pem pour Let's Encrypt)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chemin de la clé privée SSL
                </label>
                <input
                  type="text"
                  value={config.sslKeyPath || ''}
                  onChange={(e) => setConfig({ ...config, sslKeyPath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="/etc/letsencrypt/live/example.com/privkey.pem"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Chemin vers le fichier de clé privée (privkey.pem pour Let's Encrypt)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Rediriger HTTP vers HTTPS</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Forcer toutes les requêtes HTTP vers HTTPS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.redirectHttp}
                    onChange={(e) => setConfig({ ...config, redirectHttp: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Cloudflare Tunnel */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">🌐 Configuration Cloudflare Tunnel</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Pourquoi Cloudflare ?</strong> Exposez votre serveur sans ouvrir de ports, avec SSL automatique et protection DDoS intégrée. <strong>Recommandé pour Windows !</strong>
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Utiliser Cloudflare Tunnel</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Exposer votre serveur sans ouvrir de ports (recommandé)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.useCloudflare}
                onChange={(e) => setConfig({ ...config, useCloudflare: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.useCloudflare && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du tunnel Cloudflare
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.cloudflareTunnelName || 'fixtector'}
                    onChange={(e) => setConfig({ ...config, cloudflareTunnelName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="fixtector"
                    list="tunnel-names"
                  />
                  {cloudflareStatus?.tunnels && cloudflareStatus.tunnels.length > 0 && (
                    <datalist id="tunnel-names">
                      {cloudflareStatus.tunnels.map((tunnel: any) => (
                        <option key={tunnel.id} value={tunnel.name}>
                          {tunnel.name} ({tunnel.id})
                        </option>
                      ))}
                    </datalist>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {cloudflareStatus?.tunnels && cloudflareStatus.tunnels.length > 0 ? (
                    <>
                      Tunnels disponibles: {cloudflareStatus.tunnels.map((t: any) => t.name).join(', ')}. 
                      Ou créez-en un nouveau avec: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">cloudflared tunnel create [nom]</code>
                    </>
                  ) : (
                    <>
                      Nom du tunnel Cloudflare. Créez-le avec: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">cloudflared tunnel create [nom]</code>
                    </>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tunnel ID (optionnel - sera détecté automatiquement)
                </label>
                <input
                  type="text"
                  value={config.cloudflareTunnelId || ''}
                  onChange={(e) => setConfig({ ...config, cloudflareTunnelId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ID du tunnel (visible après création: cloudflared tunnel list)
                </p>
              </div>

              {/* Statut et gestion du tunnel */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Statut du tunnel</h3>
                  <button
                    onClick={() => loadCloudflareStatus(true)}
                    disabled={cloudflareLoading}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Actualiser le statut Cloudflare"
                  >
                    {cloudflareLoading ? '⏳ Vérification...' : '🔄 Actualiser'}
                  </button>
                </div>

                {cloudflareStatus && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">cloudflared installé:</span>
                      <span className={cloudflareStatus.cloudflaredInstalled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                        {cloudflareStatus.cloudflaredInstalled ? '✓ Oui' : '✗ Non'}
                      </span>
                    </div>
                    {cloudflareStatus.cloudflaredInstalled && cloudflareStatus.cloudflaredVersion && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Version:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{cloudflareStatus.cloudflaredVersion}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service en cours:</span>
                      <span className={cloudflareStatus.serviceRunning ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                        {cloudflareStatus.serviceRunning ? '✓ Oui' : '✗ Non'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Processus en cours:</span>
                      <span className={cloudflareStatus.processRunning ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                        {cloudflareStatus.processRunning ? '✓ Oui' : '✗ Non'}
                      </span>
                    </div>
                    {cloudflareStatus.tunnels && cloudflareStatus.tunnels.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Tunnels disponibles:</span>
                        <div className="mt-1 space-y-1">
                          {cloudflareStatus.tunnels.map((tunnel: any, index: number) => (
                            <div key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                              {tunnel.name} ({tunnel.id.substring(0, 8)}...)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cloudflareStatus && cloudflareStatus.cloudflaredInstalled && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex space-x-2">
                    <button
                      onClick={() => handleCloudflareAction('start')}
                      disabled={cloudflareLoading || (cloudflareStatus.serviceRunning || cloudflareStatus.processRunning)}
                      className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => handleCloudflareAction('stop')}
                      disabled={cloudflareLoading || (!cloudflareStatus.serviceRunning && !cloudflareStatus.processRunning)}
                      className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Arrêter
                    </button>
                    <button
                      onClick={() => handleCloudflareAction('restart')}
                      disabled={cloudflareLoading}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Redémarrer
                    </button>
                  </div>
                )}

                {cloudflareStatus && !cloudflareStatus.cloudflaredInstalled && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      <strong>cloudflared n'est pas installé.</strong>
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Installez-le avec: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">winget install --id Cloudflare.cloudflared</code>
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Ou utilisez le script: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">.\scripts\setup-cloudflare-windows.ps1</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration PHP (Apache uniquement) */}
      {config.serverType === 'apache' && !config.useReverseProxy && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration PHP</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version PHP
            </label>
            <select
              value={config.phpVersion || '8.1'}
              onChange={(e) => setConfig({ ...config, phpVersion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="8.0">PHP 8.0</option>
              <option value="8.1">PHP 8.1</option>
              <option value="8.2">PHP 8.2</option>
              <option value="8.3">PHP 8.3</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Version PHP pour le FastCGI (Apache uniquement)
            </p>
          </div>
        </div>
      )}

      {/* Configuration personnalisée */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Configuration personnalisée (optionnel)</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Directives supplémentaires
          </label>
          <textarea
            value={config.customConfig || ''}
            onChange={(e) => setConfig({ ...config, customConfig: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={config.serverType === 'apache' 
              ? '# Directives Apache personnalisées\n# Exemple:\n# <Directory /var/www/html>\n#   Options Indexes FollowSymLinks\n# </Directory>'
              : '# Directives Nginx personnalisées\n# Exemple:\n# location /api {\n#   proxy_pass http://localhost:3001;\n# }'}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ajoutez des directives spécifiques à votre serveur
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={generateConfig}
            disabled={generating || !config.domain}
            className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer la config
              </>
            )}
          </button>

          <button
            onClick={testConfig}
            disabled={testing || !config.domain}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Tester la config
              </>
            )}
          </button>

          <button
            onClick={saveConfig}
            disabled={saving || !config.domain || !baseUrl || !baseUrl.trim()}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </button>

          <button
            onClick={applyConfig}
            disabled={!configPreview || saving}
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Appliquer
          </button>
        </div>
      </div>

      {/* Aperçu de la configuration */}
      {configPreview && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Aperçu de la configuration</h2>
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copié!' : 'Copier'}
              </button>
              <button
                onClick={downloadConfig}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
              >
                <Download className="h-4 w-4 mr-1" />
                Télécharger
              </button>
            </div>
          </div>

          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-900 dark:text-gray-100">
            {configPreview}
          </pre>
        </div>
      )}

      {/* Résultats du test */}
      {testResult && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Résultats du test</h2>
          
          <div className="space-y-3">
            {testResult.valid && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">Configuration valide</p>
              </div>
            )}

            {!testResult.valid && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">Configuration invalide</p>
              </div>
            )}

            {testResult.errors && testResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Erreurs :</p>
                <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 space-y-1">
                  {testResult.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages de succès/erreur */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
