'use client'

import { useState } from 'react'
import { Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface CacheCleanResult {
  success: boolean
  message: string
  freed: number
  details: {
    nextjs?: number
    prisma?: number
    npm?: number
    temp?: number
    builds?: number
    db?: number
  }
}

export default function CacheCleaner() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CacheCleanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const cleanCache = async (type: string = 'all') => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/cache/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du nettoyage')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-2 border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Outils de nettoyage</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Libérez de l'espace et améliorez les performances en nettoyant les caches système
          </p>
        </div>
        <Trash2 className="h-8 w-8 text-orange-500 dark:text-orange-400" />
      </div>

      {/* Options de nettoyage */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sélectionnez le type de cache à nettoyer :</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => cleanCache('all')}
            disabled={loading}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Nettoyage...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>🧹 Tout nettoyer</span>
              </>
            )}
          </button>

          <button
            onClick={() => cleanCache('nextjs')}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
          >
            📦 Cache Next.js
          </button>

          <button
            onClick={() => cleanCache('prisma')}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
          >
            🗄️ Cache Prisma
          </button>

          <button
            onClick={() => cleanCache('npm')}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
          >
            📚 Cache npm
          </button>

          <button
            onClick={() => cleanCache('temp')}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
          >
            🗑️ Fichiers temporaires
          </button>

          <button
            onClick={() => cleanCache('builds')}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
          >
            🏗️ Anciens builds
          </button>
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Nettoyage réussi !
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Espace libéré: <strong>{formatBytes(result.freed)}</strong>
              </p>
              {result.details && Object.keys(result.details).length > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  <details>
                    <summary className="cursor-pointer hover:text-green-800">
                      Détails
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {result.details.nextjs !== undefined && (
                        <li>Next.js: {formatBytes(result.details.nextjs)}</li>
                      )}
                      {result.details.prisma !== undefined && (
                        <li>Prisma: {formatBytes(result.details.prisma)}</li>
                      )}
                      {result.details.npm !== undefined && (
                        <li>npm: {formatBytes(result.details.npm)}</li>
                      )}
                      {result.details.temp !== undefined && (
                        <li>Fichiers temporaires: {formatBytes(result.details.temp)}</li>
                      )}
                      {result.details.builds !== undefined && (
                        <li>Anciens builds: {formatBytes(result.details.builds)}</li>
                      )}
                      {result.details.db !== undefined && (
                        <li>Bases de données: {formatBytes(result.details.db)}</li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-xs text-yellow-800">
          💡 <strong>Conseil:</strong> Après le nettoyage, redémarrez le serveur pour appliquer
          les changements et améliorer les performances.
        </p>
      </div>
    </div>
  )
}

