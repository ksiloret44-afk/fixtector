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
  
  // Nettoyer la clé (supprimer les espaces, retours à la ligne, etc.)
  if (secretKey) {
    secretKey = secretKey.trim()
    // Vérifier que la clé commence par sk_test_ ou sk_live_
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      throw new Error('Format de clé Stripe invalide. La clé doit commencer par sk_test_ ou sk_live_')
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

    // Récupérer l'abonnement
    const subscription = await mainPrisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement trouvé' },
        { status: 404 }
      )
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé' },
        { status: 400 }
      )
    }

    // Réactiver l'abonnement Stripe
    const stripe = await getStripeInstance()
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    // Mettre à jour dans la base de données
    await mainPrisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        status: 'active',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur lors de la réactivation de l\'abonnement:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la réactivation' },
      { status: 500 }
    )
  }
}

