'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [devInfo, setDevInfo] = useState<{ token?: string; resetUrl?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!email || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Afficher le message d'erreur avec les détails si disponibles
        const errorMessage = data.error || 'Une erreur est survenue'
        const details = data.details ? ` (${data.details})` : ''
        setError(errorMessage + details)
        // En mode développement, afficher aussi le token si disponible
        if (data.token && data.resetUrl) {
          setDevInfo({ token: data.token, resetUrl: data.resetUrl })
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      // En mode développement, afficher aussi le token si disponible
      if (data.token && data.resetUrl) {
        setDevInfo({ token: data.token, resetUrl: data.resetUrl })
      }
      setLoading(false)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de l\'envoi de l\'email. Vérifiez votre connexion et réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full p-3">
              <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email envoyé !</p>
                <p className="text-sm mt-1">
                  Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
                {devInfo?.resetUrl && (
                  <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    <p className="font-semibold mb-1">Mode développement - Lien de réinitialisation :</p>
                    <a 
                      href={devInfo.resetUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {devInfo.resetUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                placeholder="votre@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link 
            href="/login" 
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}


