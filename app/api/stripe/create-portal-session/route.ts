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
  
  const secretKey = config?.secretKey || process.env.STRIPE_SECRET_KEY || ''
  
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

    const mainPrisma = getMainPrisma()

    // Récupérer l'abonnement
    const subscription = await mainPrisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun client Stripe trouvé' },
        { status: 400 }
      )
    }

    // Créer une session pour le portail client Stripe
    const stripe = await getStripeInstance()
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3001'
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Erreur lors de la création de la session du portail:', error)
    
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
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}

