import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription-check'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    const status = await checkSubscriptionStatus(userId, userRole)

    return NextResponse.json({
      hasActiveSubscription: status.hasActiveSubscription,
      hasActiveTrial: status.hasActiveTrial,
      isBlocked: status.isBlocked,
      reason: status.reason,
      subscription: status.subscription,
      trial: status.trial ? {
        expiresAt: status.trial.expiresAt.toISOString(),
        isActive: status.trial.isActive,
      } : undefined,
    })
  } catch (error: any) {
    console.error('Erreur lors de la vérification de l\'abonnement:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}

