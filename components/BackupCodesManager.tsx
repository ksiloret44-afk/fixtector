'use client'

import { useState, useEffect } from 'react'
import { Key, Download, AlertTriangle, CheckCircle, Copy } from 'lucide-react'

export default function BackupCodesManager() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchRemainingCodes()
  }, [])

  const fetchRemainingCodes = async () => {
    try {
      const response = await fetch('/api/auth/backup-codes/status')
      if (response.ok) {
        const data = await response.json()
        setRemainingCodes(data.remaining)
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du statut:', err)
    }
  }

  const handleGenerate = async () => {
    if (!confirm('Générer de nouveaux codes de secours supprimera tous les codes existants. Êtes-vous sûr ?')) {
      return
    }

    setGenerating(true)
    setError('')
    setCodes(null)

    try {
      const response = await fetch('/api/auth/backup-codes/generate', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération des codes')
      }

      setCodes(data.codes)
      setRemainingCodes(5)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération des codes de secours')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!codes) return

    const text = codes.join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!codes) return

    const text = codes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codes-de-secours-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-3">
          <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Codes de secours
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Utilisez ces codes si vous ne pouvez pas recevoir le code par email
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {remainingCodes !== null && remainingCodes < 3 && remainingCodes > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Attention : Il ne vous reste que {remainingCodes} code{remainingCodes > 1 ? 's' : ''} de secours.
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Pensez à générer de nouveaux codes pour éviter de perdre l'accès à votre compte.
              </p>
            </div>
          </div>
        </div>
      )}

      {remainingCodes === 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Aucun code de secours disponible
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Générez de nouveaux codes de secours pour pouvoir vous connecter en cas de problème avec l'email.
              </p>
            </div>
          </div>
        </div>
      )}

      {codes && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Codes de secours générés
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Sauvegardez ces codes dans un endroit sûr. Ils ne seront affichés qu'une seule fois.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-md p-4 mb-3">
            <div className="grid grid-cols-1 gap-2 font-mono text-sm">
              {codes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-900 dark:text-gray-100 font-bold tracking-wider">{code}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          'Génération...'
        ) : codes ? (
          'Générer de nouveaux codes'
        ) : (
          <>
            <Key className="h-4 w-4" />
            Générer des codes de secours
          </>
        )}
      </button>

      {remainingCodes !== null && remainingCodes > 0 && !codes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {remainingCodes} code{remainingCodes > 1 ? 's' : ''} de secours disponible{remainingCodes > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

