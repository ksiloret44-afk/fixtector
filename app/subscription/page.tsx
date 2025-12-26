'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  status: string
  plan: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  lastPaymentStatus?: string
  lastPaymentDate?: string
  hasActiveTrial: boolean
  trialExpiresAt?: string
  stripeCustomerId?: string
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Synchronisation silencieuse (sans afficher de message)
  const syncSubscriptionSilently = async () => {
    try {
      const response = await fetch('/api/subscription/sync', {
        method: 'POST',
      })

      if (response.ok) {
        // Recharger les données silencieusement
        await loadSubscription()
      }
    } catch (err: any) {
      // Ne pas afficher d'erreur pour la synchronisation silencieuse
      console.error('Erreur lors de la synchronisation silencieuse:', err)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      // Charger l'abonnement puis synchroniser automatiquement avec Stripe
      loadSubscription().then(() => {
        // Synchroniser automatiquement après le chargement initial
        syncSubscriptionSilently()
      })
    }
  }, [status, router])

  // Synchronisation automatique périodique (toutes les 30 secondes)
  useEffect(() => {
    if (status !== 'authenticated' || !subscription) return

    const interval = setInterval(() => {
      syncSubscriptionSilently()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [status, subscription])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription/status')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setSubscription(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      setProcessing(true)
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      // Rediriger vers le portail Stripe
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l\'accès à toutes les fonctionnalités à la fin de la période actuelle.')) {
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation')
      }

      // Recharger les données
      await loadSubscription()
      alert('Votre abonnement sera annulé à la fin de la période actuelle.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      setProcessing(true)
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réactivation')
      }

      // Recharger les données
      await loadSubscription()
      alert('Votre abonnement a été réactivé avec succès.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleSyncSubscription = async () => {
    try {
      setProcessing(true)
      setError(null)
      const response = await fetch('/api/subscription/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la synchronisation')
      }

      // Recharger les données
      await loadSubscription()
      alert('Abonnement synchronisé avec succès depuis Stripe.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Actif
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-4 w-4 mr-1" />
            Paiement en retard
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-4 w-4 mr-1" />
            Annulé
          </span>
        )
      case 'trialing':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="h-4 w-4 mr-1" />
            Essai
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au tableau de bord
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Gestion de l'abonnement</h1>
            <p className="text-gray-600 mt-1">Gérez votre abonnement FixTector</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-6">
            {!subscription ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun abonnement actif
                </h2>
                <p className="text-gray-600 mb-6">
                  Souscrivez à un abonnement pour accéder à toutes les fonctionnalités.
                </p>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Souscrire à un abonnement
                </Link>
              </div>
            ) : (
              <>
                {/* Statut de l'abonnement */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Statut de l'abonnement</h2>
                    {getStatusBadge(subscription.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Plan</p>
                      <p className="font-semibold text-gray-900">
                        {subscription.plan === 'standard' ? 'Forfait Standard' : subscription.plan}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Prix</p>
                      <p className="font-semibold text-gray-900">19,99€ / mois</p>
                    </div>
                    {subscription.currentPeriodStart && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Période actuelle</p>
                        <p className="font-semibold text-gray-900">
                          Du {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')}
                          {subscription.currentPeriodEnd && (
                            <> au {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}</>
                          )}
                        </p>
                      </div>
                    )}
                    {subscription.lastPaymentStatus && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Dernier paiement</p>
                        <p className="font-semibold text-gray-900">
                          {subscription.lastPaymentStatus === 'succeeded' ? (
                            <span className="text-green-600">✓ Réussi</span>
                          ) : (
                            <span className="text-red-600">✗ Échoué</span>
                          )}
                          {subscription.lastPaymentDate && (
                            <> - {new Date(subscription.lastPaymentDate).toLocaleDateString('fr-FR')}</>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Essai actif */}
                {subscription.hasActiveTrial && subscription.trialExpiresAt && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          Essai gratuit actif
                        </p>
                        <p className="text-sm text-blue-700">
                          Expire le {new Date(subscription.trialExpiresAt).toLocaleDateString('fr-FR', {
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

                {/* Annulation programmée */}
                {subscription.cancelAtPeriodEnd && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-900">
                          Annulation programmée
                        </p>
                        <p className="text-sm text-yellow-700">
                          Votre abonnement sera annulé à la fin de la période actuelle.
                          {subscription.currentPeriodEnd && (
                            <> ({new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')})</>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={handleReactivateSubscription}
                        disabled={processing}
                        className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Réactiver
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleManageBilling}
                        disabled={processing || !subscription.stripeCustomerId}
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        {processing ? 'Chargement...' : 'Gérer la facturation et la méthode de paiement'}
                      </button>

                      <button
                        onClick={handleSyncSubscription}
                        disabled={processing}
                        className="inline-flex items-center justify-center px-6 py-3 border border-blue-300 rounded-lg text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Synchroniser avec Stripe
                      </button>

                      {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={processing}
                          className="inline-flex items-center justify-center px-6 py-3 border border-red-300 rounded-lg text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Annuler l'abonnement
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Les paiements sont gérés de manière sécurisée par Stripe</li>
                      <li>• Vous pouvez annuler votre abonnement à tout moment</li>
                      <li>• L'annulation prend effet à la fin de la période de facturation actuelle</li>
                      <li>• Vous pouvez réactiver votre abonnement avant la fin de la période</li>
                      <li>• Pour toute question, contactez le support</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

