import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'
import Stripe from 'stripe'

// Récupérer la clé Stripe depuis la config en base ou les variables d'environnement
async function getStripeInstance() {
  const mainPrisma = getMainPrisma()
  const config = await mainPrisma.stripeConfig.findUnique({
    where: { key: 'stripe_config' },
  })
  
  let secretKey = config?.secretKey || process.env.STRIPE_SECRET_KEY || ''
  
  // Nettoyer la clé
  if (secretKey) {
    secretKey = secretKey.trim()
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      throw new Error('Format de clé Stripe invalide')
    }
  }
  
  if (!secretKey) {
    throw new Error('Clé secrète Stripe non configurée')
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const mainPrisma = getMainPrisma()

    // Récupérer l'abonnement depuis la base de données
    const dbSubscription = await mainPrisma.subscription.findUnique({
      where: { userId },
    })

    if (!dbSubscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé' },
        { status: 400 }
      )
    }

    // Récupérer l'abonnement depuis Stripe
    const stripe = await getStripeInstance()
    const stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.stripeSubscriptionId)

    // Mettre à jour l'abonnement dans la base de données avec les données Stripe
    const updatedSubscription = await mainPrisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: stripeSubscription.status === 'active' ? 'active' : 
                stripeSubscription.status === 'past_due' ? 'past_due' :
                stripeSubscription.status === 'canceled' ? 'cancelled' : 
                stripeSubscription.status === 'trialing' ? 'trialing' : 'cancelled',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        cancelledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
        stripePriceId: stripeSubscription.items.data[0]?.price.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Abonnement synchronisé avec succès',
      subscription: {
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        cancelledAt: updatedSubscription.cancelledAt?.toISOString(),
        currentPeriodEnd: updatedSubscription.currentPeriodEnd?.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Erreur lors de la synchronisation:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synchronisation' },
      { status: 500 }
    )
  }
}



