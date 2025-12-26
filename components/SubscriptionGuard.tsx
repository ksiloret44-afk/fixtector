'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import SubscriptionBlock from './SubscriptionBlock'

// Routes qui ne nécessitent pas de vérification d'abonnement
const exemptRoutes = [
  '/login',
  '/register',
  '/landing',
  '/subscribe',
  '/subscribe/success',
  '/subscription',
  '/forgot-password',
  '/reset-password',
  '/track',
  '/r',
  '/review',
  '/company-review',
  '/client',
  '/test-smtp',
]

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isBlocked: boolean
    reason?: string
    trialExpiresAt?: Date
    showTrialInfo?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si la route est exemptée
    const isExempt = exemptRoutes.some(route => pathname?.startsWith(route))
    
    // Les admins sont exemptés de la vérification d'abonnement
    const isAdmin = (session?.user as any)?.role === 'admin'
    
    if (isExempt || status === 'loading' || !session?.user || isAdmin) {
      setLoading(false)
      return
    }

    // Vérifier le statut de l'abonnement
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/check')
        const data = await response.json()

        if (response.ok) {
          setSubscriptionStatus({
            isBlocked: data.isBlocked,
            reason: data.reason,
            trialExpiresAt: data.trial?.expiresAt ? new Date(data.trial.expiresAt) : undefined,
            showTrialInfo: data.hasActiveTrial && !data.isBlocked,
          })
        } else {
          // En cas d'erreur, on laisse passer (pour éviter de bloquer en cas de problème)
          setSubscriptionStatus({ isBlocked: false })
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'abonnement:', error)
        // En cas d'erreur, on laisse passer
        setSubscriptionStatus({ isBlocked: false })
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [session, pathname, status])

  // Afficher le contenu pendant le chargement
  if (loading) {
    return <>{children}</>
  }

  // Si le compte est bloqué, afficher le message de blocage
  if (subscriptionStatus?.isBlocked) {
    return (
      <SubscriptionBlock
        reason={subscriptionStatus.reason || 'Votre accès est restreint.'}
        showTrialInfo={subscriptionStatus.showTrialInfo}
        trialExpiresAt={subscriptionStatus.trialExpiresAt}
      />
    )
  }

  // Sinon, afficher le contenu normal
  return <>{children}</>
}

