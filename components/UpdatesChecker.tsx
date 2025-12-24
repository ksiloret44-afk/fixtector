'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Download, CheckCircle, AlertCircle, Loader2, ExternalLink, X } from 'lucide-react'

interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  releaseNotes?: string
  releaseUrl?: string
  publishedAt?: string
  releaseName?: string
  error?: string
}

export default function UpdatesChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error', message: string } | null>(null)

  useEffect(() => {
    checkForUpdates()
  }, [])

  // Effacer la notification après 5 secondes
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const checkForUpdates = async () => {
    setChecking(true)
    setNotification(null)
    try {
      // Forcer le rafraîchissement en ajoutant un timestamp
      const response = await fetch(`/api/updates/check?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const data = await response.json()
      setUpdateInfo(data)
      
      // Afficher une notification selon le résultat
      if (data.error) {
        setNotification({
          type: 'error',
          message: data.error || 'Impossible de vérifier les mises à jour',
        })
      } else if (data.updateAvailable) {
        setNotification({
          type: 'info',
          message: `Mise à jour disponible ! Version ${data.latestVersion} est disponible.`,
        })
      } else {
        setNotification({
          type: 'success',
          message: 'Vous êtes sur la dernière version disponible.',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
      setUpdateInfo({
        currentVersion: '2.0.0',
        latestVersion: '2.0.0',
        updateAvailable: false,
        error: 'Impossible de vérifier les mises à jour',
      })
      setNotification({
        type: 'error',
        message: 'Impossible de vérifier les mises à jour. Vérifiez votre connexion internet.',
      })
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Vérification des mises à jour...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-top-5 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : notification.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {notification.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
          {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
          <p className="text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* En-tête avec bouton de rafraîchissement */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">État des mises à jour</h2>
          <button
            onClick={checkForUpdates}
            disabled={checking}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Vérification...' : 'Vérifier maintenant'}
          </button>
        </div>

        {updateInfo && (
          <div className="space-y-4">
            {/* Version actuelle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Version actuelle</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{updateInfo.currentVersion}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>

            {/* Dernière version disponible */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Dernière version disponible</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{updateInfo.latestVersion}</p>
              </div>
              {updateInfo.updateAvailable ? (
                <AlertCircle className="h-8 w-8 text-orange-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>

            {/* Statut de mise à jour */}
            {updateInfo.updateAvailable ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      Une nouvelle version est disponible !
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Version {updateInfo.latestVersion} est disponible. Vous utilisez actuellement la version {updateInfo.currentVersion}.
                    </p>
                    {updateInfo.releaseUrl && (
                      <a
                        href={updateInfo.releaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-3 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Voir la release sur GitHub
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Vous utilisez la dernière version disponible
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Aucune mise à jour disponible pour le moment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes de version */}
            {updateInfo.releaseNotes && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Notes de version {updateInfo.latestVersion}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{
                      __html: updateInfo.releaseNotes
                        .replace(/\n/g, '<br />')
                        .replace(/#{1,6}\s(.+)/g, '<strong>$1</strong>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                    }}
                  />
                </div>
                {updateInfo.publishedAt && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Publié le {formatDate(updateInfo.publishedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Erreur */}
            {updateInfo.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Erreur</p>
                    <p className="text-sm text-red-700 mt-1">{updateInfo.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions de mise à jour */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Comment mettre à jour ?</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Mise à jour automatique (recommandé)</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Si vous avez installé via le script d'installation, utilisez le script de mise à jour :
            </p>
            <code className="block bg-blue-100 dark:bg-blue-900/50 px-4 py-2 rounded text-sm text-blue-900 dark:text-blue-200">
              sudo /home/fixtector/fixtector/update.sh
            </code>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Mise à jour manuelle</p>
            <ol className="text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside space-y-2">
              <li>Téléchargez la dernière release depuis GitHub</li>
              <li>Arrêtez le serveur : <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-gray-100">pm2 stop fixtector</code></li>
              <li>
                Remplacez les fichiers (sauf <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-gray-100">.env.local</code> et les bases de données) :
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                  <li><strong>Base de données principale :</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">prisma/main.db</code></li>
                  <li><strong>Bases de données des entreprises :</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">prisma/companies/*.db</code> (tous les fichiers .db dans ce dossier)</li>
                </ul>
              </li>
              <li>Installez les dépendances : <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-gray-100">npm install</code></li>
              <li>Rebuild : <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-gray-100">npm run build</code></li>
              <li>Redémarrez : <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-gray-100">pm2 restart fixtector</code></li>
            </ol>
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">⚠️ Important :</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                Ne supprimez jamais les fichiers <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">prisma/main.db</code> et <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">prisma/companies/*.db</code> car ils contiennent toutes vos données. 
                En cas de doute, faites une sauvegarde avant la mise à jour.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

