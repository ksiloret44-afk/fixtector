'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CreditCard, AlertCircle, Clock, Loader2 } from 'lucide-react'

interface SubscriptionBlockProps {
  reason: string
  showTrialInfo?: boolean
  trialExpiresAt?: Date
}

export default function SubscriptionBlock({ reason, showTrialInfo, trialExpiresAt }: SubscriptionBlockProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = () => {
    setLoading(true)
    setError(null)
    try {
      // Utiliser window.location pour forcer la navigation
      window.location.href = '/subscribe'
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la navigation')
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accès restreint
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {reason}
          </p>
        </div>

        {showTrialInfo && trialExpiresAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Votre essai expire le {new Date(trialExpiresAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pourquoi souscrire à un abonnement ?
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Accès illimité à toutes les fonctionnalités</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Toutes vos données sont conservées</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Support prioritaire</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">✓</span>
              <span>Mises à jour régulières</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Souscrire à un abonnement (19,99€/mois)
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Paiement sécurisé via Stripe • Annulation possible à tout moment
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

