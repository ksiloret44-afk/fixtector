'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CheckCircle, CreditCard, Shield, Zap, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SubscribePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/subscribe')
    }
  }, [status, router])

  const handleSubscribe = async () => {
    if (!session?.user) {
      router.push('/login?redirect=/subscribe')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Passez à un compte actif
          </h1>
          <p className="text-xl text-gray-600">
            Continuez à utiliser FixTector avec toutes vos données conservées
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Plan unique */}
            <div className="border-2 border-primary-500 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Forfait Standard</h2>
                  <p className="text-gray-600 mt-1">Accès complet à toutes les fonctionnalités</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary-600">19,99€</div>
                  <div className="text-sm text-gray-500">/mois</div>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ce qui est inclus :
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Accès illimité à toutes les fonctionnalités</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Gestion complète des réparations, clients, stock</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Devis et factures conformes UE 2025/2026</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Notifications automatiques (email et SMS optionnel)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Calendrier de rendez-vous intégré</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Rapports et statistiques avancés</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Toutes vos données sont conservées</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Garanties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Shield className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900">Paiement sécurisé</div>
                  <div className="text-sm text-gray-600">Stripe</div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Zap className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900">Activation immédiate</div>
                  <div className="text-sm text-gray-600">Après paiement</div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <div className="font-semibold text-gray-900">Annulation facile</div>
                  <div className="text-sm text-gray-600">À tout moment</div>
                </div>
              </div>
            </div>

            {/* Bouton de paiement */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Redirection vers le paiement...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payer 19,99€ / mois
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              En cliquant sur ce bouton, vous serez redirigé vers Stripe pour finaliser votre paiement.
              <br />
              Votre abonnement sera activé immédiatement après le paiement réussi.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}




