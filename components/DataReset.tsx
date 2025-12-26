'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Download, Trash2, Lock, CheckCircle, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

const ABSOLUTE_ADMIN_EMAIL = 'rpphone@ik.me'

export default function DataReset() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'password' | 'confirm1' | 'confirm2' | 'confirm3' | 'delete' | 'processing' | 'success' | 'error'>('idle')
  const [password, setPassword] = useState('')
  const [confirmation1, setConfirmation1] = useState(false)
  const [confirmation2, setConfirmation2] = useState(false)
  const [confirmation3, setConfirmation3] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [backupDownloaded, setBackupDownloaded] = useState(false)

  const user = session?.user as any
  const isAbsoluteAdmin = user?.email === ABSOLUTE_ADMIN_EMAIL && user?.role === 'admin'

  if (!isAbsoluteAdmin) {
    return null
  }

  const handleStart = () => {
    setStep('password')
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmation1(false)
    setConfirmation2(false)
    setConfirmation3(false)
    setDeleteText('')
    setBackupDownloaded(false)
  }

  const handleBackup = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      // Télécharger le fichier
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setBackupDownloaded(true)
      setSuccess('Sauvegarde téléchargée avec succès')
      setStep('confirm1')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm1 = () => {
    if (confirmation1) {
      setStep('confirm2')
      setError('')
    } else {
      setError('Vous devez confirmer pour continuer')
    }
  }

  const handleConfirm2 = () => {
    if (confirmation2) {
      setStep('confirm3')
      setError('')
    } else {
      setError('Vous devez confirmer pour continuer')
    }
  }

  const handleConfirm3 = () => {
    if (confirmation3) {
      setStep('delete')
      setError('')
    } else {
      setError('Vous devez confirmer pour continuer')
    }
  }

  const handleDelete = async () => {
    if (deleteText !== 'DELETE') {
      setError('Vous devez écrire exactement "DELETE" pour confirmer')
      return
    }

    setStep('processing')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation: deleteText }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      const data = await response.json()
      setSuccess(`Données supprimées avec succès : ${data.deleted.customers} clients, ${data.deleted.repairs} réparations, ${data.deleted.quotes} devis, ${data.deleted.invoices} factures`)
      setStep('success')
      
      // Rafraîchir les données et recharger la page après 2 secondes pour mettre à jour le tableau de bord
      setTimeout(() => {
        // Rafraîchir le routeur Next.js pour invalider le cache
        router.refresh()
        // Recharger complètement la page après un court délai
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('idle')
    setPassword('')
    setConfirmation1(false)
    setConfirmation2(false)
    setConfirmation3(false)
    setDeleteText('')
    setError('')
    setSuccess('')
    setBackupDownloaded(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-md p-3">
          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Remise à zéro des données
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supprimer tous les clients, réparations, devis et factures de toutes les entreprises
          </p>
        </div>
      </div>

      {step === 'idle' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  ⚠️ Action irréversible
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Cette action supprimera définitivement tous les clients, réparations, devis et factures 
                  de toutes les entreprises. Une sauvegarde complète sera créée avant la suppression.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleStart}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Commencer la remise à zéro
          </button>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
            <div className="flex">
              <Lock className="h-5 w-5 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Vérification du mot de passe
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Entrez le mot de passe de l'administrateur absolu ({ABSOLUTE_ADMIN_EMAIL})
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Entrez votre mot de passe"
            />
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              disabled={!password || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Création de la sauvegarde...'
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Créer et télécharger la sauvegarde
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {step === 'confirm1' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Confirmation 1/3
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirm1"
              checked={confirmation1}
              onChange={(e) => setConfirmation1(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="confirm1" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Je confirme que je veux supprimer toutes les données
            </label>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm1}
              disabled={!confirmation1}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {step === 'confirm2' && (
        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Confirmation 2/3
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Cette action supprimera définitivement tous les clients, réparations, devis et factures.
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirm2"
              checked={confirmation2}
              onChange={(e) => setConfirmation2(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="confirm2" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Je comprends que cette action est irréversible
            </label>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm2}
              disabled={!confirmation2}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {step === 'confirm3' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Confirmation 3/3 - Dernière chance
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Vous êtes sur le point de supprimer toutes les données. Cette action ne peut pas être annulée.
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirm3"
              checked={confirmation3}
              onChange={(e) => setConfirmation3(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="confirm3" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Je confirme une dernière fois que je veux supprimer toutes les données
            </label>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm3}
              disabled={!confirmation3}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer vers la confirmation finale
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {step === 'delete' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Confirmation finale
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Pour confirmer la suppression, écrivez exactement <strong>DELETE</strong> dans le champ ci-dessous.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Écrivez DELETE pour confirmer
            </label>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
              placeholder="DELETE"
            />
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleteText !== 'DELETE' || loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Suppression en cours...' : 'Supprimer toutes les données'}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Suppression en cours...</p>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Suppression réussie
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {success}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  La page va se recharger automatiquement pour mettre à jour le tableau de bord...
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              router.refresh()
              setTimeout(() => window.location.reload(), 100)
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Recharger maintenant
          </button>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erreur
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}

