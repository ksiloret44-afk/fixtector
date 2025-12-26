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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const sessionId = req.nextUrl.searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID manquant' },
        { status: 400 }
      )
    }

    // Récupérer la session Stripe
    const stripe = await getStripeInstance()
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non effectué' },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const mainPrisma = getMainPrisma()

    // Vérifier que l'abonnement existe
    let subscription = await mainPrisma.subscription.findUnique({
      where: { userId },
    })

    // Si l'abonnement n'existe pas encore (webhook pas encore traité), le créer depuis la session Stripe
    if (!subscription || subscription.status !== 'active') {
      const subscriptionId = checkoutSession.subscription as string
      
      if (subscriptionId) {
        // Récupérer l'abonnement depuis Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        // Créer ou mettre à jour l'abonnement dans la base de données
        subscription = await mainPrisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            status: stripeSubscription.status === 'active' ? 'active' : 'trialing',
            plan: 'standard',
            stripeCustomerId: stripeSubscription.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: new Date(),
          },
          update: {
            status: stripeSubscription.status === 'active' ? 'active' : 'trialing',
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: stripeSubscription.items.data[0]?.price.id,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: new Date(),
          },
        })

        // Marquer l'essai comme converti si nécessaire
        await mainPrisma.trial.updateMany({
          where: { userId, isActive: true },
          data: {
            isActive: false,
            convertedToSubscription: true,
            convertedAt: new Date(),
          },
        })
      } else {
        return NextResponse.json(
          { error: 'Abonnement non trouvé dans la session Stripe' },
          { status: 400 }
        )
      }
    }

    // Vérifier que l'abonnement est actif
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: `Abonnement trouvé mais statut: ${subscription.status}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, subscription })
  } catch (error: any) {
    console.error('Erreur lors de la vérification de la session:', error)
    
    // Message d'erreur plus clair si la clé Stripe n'est pas configurée
    if (error.message?.includes('Clé secrète Stripe non configurée') || 
        error.message?.includes('API key') || 
        error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          error: 'Stripe n\'est pas configuré. Veuillez configurer vos clés Stripe dans les paramètres (onglet Stripe).',
          details: 'L\'administrateur doit configurer les clés Stripe dans Paramètres > Stripe'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}

