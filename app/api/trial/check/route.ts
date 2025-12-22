import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkTrialStatus, checkSubscriptionStatus, canUserAccess } from '@/lib/trial-checker'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const access = await canUserAccess(userId)
    const trial = await checkTrialStatus(userId)
    const subscription = await checkSubscriptionStatus(userId)

    return NextResponse.json({
      canAccess: access.canAccess,
      reason: access.reason,
      expiresAt: access.expiresAt,
      trial: {
        hasTrial: trial.hasTrial,
        isExpired: trial.isExpired,
        isActive: trial.isActive,
        expiresAt: trial.expiresAt,
      },
      subscription: {
        hasSubscription: subscription.hasSubscription,
        isActive: subscription.isActive,
        status: subscription.status,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la vérification:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

