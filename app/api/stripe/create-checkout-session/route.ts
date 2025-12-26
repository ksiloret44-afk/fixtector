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
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email utilisateur manquant' },
        { status: 400 }
      )
    }

    // Vérifier que Stripe est configuré et activé
    const mainPrisma = getMainPrisma()
    const stripeConfig = await mainPrisma.stripeConfig.findUnique({
      where: { key: 'stripe_config' },
    })

    if (!stripeConfig?.isActive || !stripeConfig?.secretKey) {
      return NextResponse.json(
        { 
          error: 'Stripe n\'est pas configuré ou activé. Veuillez configurer vos clés Stripe dans les paramètres (onglet Stripe).',
          details: 'L\'administrateur doit activer Stripe et configurer les clés dans Paramètres > Stripe'
        },
        { status: 400 }
      )
    }

    const stripe = await getStripeInstance()

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await mainPrisma.subscription.findUnique({
      where: { userId },
    })

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif' },
        { status: 400 }
      )
    }

    // Récupérer ou créer un client Stripe
    let stripeCustomerId = existingSubscription?.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      })
      stripeCustomerId = customer.id

      // Sauvegarder le customer ID si un abonnement existe déjà
      if (existingSubscription) {
        await mainPrisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId },
        })
      }
    }

    // Créer ou récupérer le produit et le prix Stripe
    // Selon la documentation Stripe Billing (https://docs.stripe.com/billing/quickstart),
    // il est préférable de créer le produit/prix une fois et de réutiliser le price_id
    let priceId = existingSubscription?.stripePriceId

    if (!priceId) {
      // Vérifier si un price_id est configuré dans la base de données
      const stripeConfig = await mainPrisma.stripeConfig.findUnique({
        where: { key: 'stripe_config' },
      })

      if (stripeConfig?.stripePriceId) {
        priceId = stripeConfig.stripePriceId
      } else {
        // Créer le produit selon la documentation Stripe
        const product = await stripe.products.create({
          name: 'FixTector - Forfait Standard',
          description: 'Accès complet à toutes les fonctionnalités de FixTector',
        })

        // Créer le prix récurrent mensuel selon la documentation Stripe
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: 1999, // 19.99€ en centimes
          currency: 'eur',
          recurring: {
            interval: 'month',
          },
        })

        priceId = price.id

        // Sauvegarder le price_id dans la configuration pour réutilisation future
        await mainPrisma.stripeConfig.upsert({
          where: { key: 'stripe_config' },
          update: {
            stripePriceId: priceId,
          },
          create: {
            key: 'stripe_config',
            stripePriceId: priceId,
            isActive: false,
          },
        })
      }
    }

    // Créer la session de checkout Stripe selon la documentation officielle
    // https://docs.stripe.com/billing/quickstart
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3001'
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe?canceled=true`,
      metadata: {
        userId: userId,
      },
      // Options supplémentaires recommandées par Stripe
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      // Permettre la mise à jour de la méthode de paiement
      payment_method_collection: 'always',
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Erreur lors de la création de la session Stripe:', error)
    
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
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}

