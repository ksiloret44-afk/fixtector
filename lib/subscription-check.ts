import { getMainPrisma } from './db-manager'

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  hasActiveTrial: boolean
  subscription?: {
    status: string
    currentPeriodEnd?: Date
    lastPaymentStatus?: string
  }
  trial?: {
    expiresAt: Date
    isActive: boolean
  }
  isBlocked: boolean
  reason?: string
}

export async function checkSubscriptionStatus(userId: string, userRole?: string): Promise<SubscriptionStatus> {
  const mainPrisma = getMainPrisma()

  // Les admins sont exemptés de la vérification d'abonnement
  if (userRole === 'admin') {
    return {
      hasActiveSubscription: true,
      hasActiveTrial: false,
      isBlocked: false,
    }
  }

  // Récupérer l'abonnement et l'essai
  const [subscription, trial] = await Promise.all([
    mainPrisma.subscription.findUnique({
      where: { userId },
    }),
    mainPrisma.trial.findUnique({
      where: { userId },
    }),
  ])

  const hasActiveSubscription = subscription?.status === 'active'
  const hasActiveTrial = trial?.isActive === true && new Date(trial.expiresAt) > new Date()

  // Vérifier si le compte doit être bloqué
  let isBlocked = false
  let reason: string | undefined

  if (!hasActiveSubscription && !hasActiveTrial) {
    // Pas d'abonnement actif et essai expiré
    isBlocked = true
    reason = 'Votre essai gratuit a expiré. Veuillez souscrire à un abonnement pour continuer à utiliser FixTector.'
  } else if (hasActiveSubscription && subscription.status === 'past_due') {
    // Abonnement en retard de paiement
    isBlocked = true
    reason = 'Votre dernier paiement a échoué. Veuillez mettre à jour votre méthode de paiement pour continuer à utiliser FixTector.'
  } else if (hasActiveSubscription && subscription.status === 'cancelled') {
    // Abonnement annulé
    isBlocked = true
    reason = 'Votre abonnement a été annulé. Veuillez souscrire à un nouvel abonnement pour continuer à utiliser FixTector.'
  } else if (hasActiveTrial && new Date(trial.expiresAt) <= new Date()) {
    // Essai expiré
    isBlocked = true
    reason = 'Votre essai gratuit de 24 heures a expiré. Veuillez souscrire à un abonnement pour continuer à utiliser FixTector.'
  }

  return {
    hasActiveSubscription,
    hasActiveTrial,
    subscription: subscription ? {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd || undefined,
      lastPaymentStatus: subscription.lastPaymentStatus || undefined,
    } : undefined,
    trial: trial ? {
      expiresAt: trial.expiresAt,
      isActive: trial.isActive,
    } : undefined,
    isBlocked,
    reason,
  }
}

