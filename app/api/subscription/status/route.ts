import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

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

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Récupérer l'abonnement et l'essai
    const [subscription, trial] = await Promise.all([
      mainPrisma.subscription.findUnique({
        where: { userId },
      }),
      mainPrisma.trial.findUnique({
        where: { userId },
      }),
    ])

    return NextResponse.json({
      status: subscription?.status || null,
      plan: subscription?.plan || null,
      currentPeriodStart: subscription?.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      cancelledAt: subscription?.cancelledAt?.toISOString() || null,
      lastPaymentStatus: subscription?.lastPaymentStatus || null,
      lastPaymentDate: subscription?.lastPaymentDate?.toISOString() || null,
      stripeCustomerId: subscription?.stripeCustomerId || null,
      hasActiveTrial: trial?.isActive === true && new Date(trial.expiresAt) > new Date(),
      trialExpiresAt: trial?.expiresAt?.toISOString() || null,
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération du statut:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération du statut' },
      { status: 500 }
    )
  }
}




