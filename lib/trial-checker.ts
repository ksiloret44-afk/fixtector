import { getMainPrisma } from './db-manager'

/**
 * Vérifie si l'utilisateur a un essai actif et non expiré
 */
export async function checkTrialStatus(userId: string): Promise<{
  hasTrial: boolean
  isExpired: boolean
  expiresAt: Date | null
  isActive: boolean
}> {
  const prisma = getMainPrisma()
  
  const trial = await prisma.trial.findUnique({
    where: { userId },
  })

  if (!trial) {
    return {
      hasTrial: false,
      isExpired: false,
      expiresAt: null,
      isActive: false,
    }
  }

  const now = new Date()
  const isExpired = trial.expiresAt < now

  // Si l'essai est expiré, le désactiver
  if (isExpired && trial.isActive) {
    await prisma.trial.update({
      where: { id: trial.id },
      data: { isActive: false },
    })
  }

  return {
    hasTrial: true,
    isExpired,
    expiresAt: trial.expiresAt,
    isActive: trial.isActive && !isExpired,
  }
}

/**
 * Vérifie si l'utilisateur a un abonnement actif
 */
export async function checkSubscriptionStatus(userId: string): Promise<{
  hasSubscription: boolean
  isActive: boolean
  status: string | null
}> {
  const prisma = getMainPrisma()
  
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
      status: null,
    }
  }

  return {
    hasSubscription: true,
    isActive: subscription.status === 'active' || subscription.status === 'trialing',
    status: subscription.status,
  }
}

/**
 * Vérifie si l'utilisateur peut accéder à l'application
 * (a un abonnement actif OU un essai actif non expiré)
 * Les admins ont toujours accès
 */
export async function canUserAccess(userId: string, userRole?: string): Promise<{
  canAccess: boolean
  reason: 'subscription' | 'trial' | 'expired' | 'none' | 'admin'
  expiresAt: Date | null
}> {
  // Les admins ont toujours accès
  if (userRole === 'admin') {
    return {
      canAccess: true,
      reason: 'admin',
      expiresAt: null,
    }
  }

  const subscription = await checkSubscriptionStatus(userId)
  
  if (subscription.isActive) {
    return {
      canAccess: true,
      reason: 'subscription',
      expiresAt: null,
    }
  }

  const trial = await checkTrialStatus(userId)
  
  if (trial.isActive) {
    return {
      canAccess: true,
      reason: 'trial',
      expiresAt: trial.expiresAt,
    }
  }

  if (trial.hasTrial && trial.isExpired) {
    return {
      canAccess: false,
      reason: 'expired',
      expiresAt: trial.expiresAt,
    }
  }

  return {
    canAccess: false,
    reason: 'none',
    expiresAt: null,
  }
}

