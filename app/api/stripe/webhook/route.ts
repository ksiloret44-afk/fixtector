import { NextRequest, NextResponse } from 'next/server'
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

async function getWebhookSecret() {
  const mainPrisma = getMainPrisma()
  const config = await mainPrisma.stripeConfig.findUnique({
    where: { key: 'stripe_config' },
  })
  
  return config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
}

// Désactiver le body parsing pour Stripe webhook
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  const webhookSecret = await getWebhookSecret()
  
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret non configuré' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = await getStripeInstance()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Erreur de vérification webhook:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const mainPrisma = getMainPrisma()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('userId manquant dans les métadonnées')
          break
        }

        // Récupérer la subscription depuis Stripe
        const subscriptionId = session.subscription as string
        if (!subscriptionId) {
          console.error('subscriptionId manquant')
          break
        }

        const stripe = await getStripeInstance()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Créer ou mettre à jour l'abonnement dans la base de données
        await mainPrisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            status: subscription.status === 'active' ? 'active' : 'trialing',
            plan: 'standard',
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: new Date(),
          },
          update: {
            status: subscription.status === 'active' ? 'active' : 'trialing',
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            lastPaymentStatus: 'succeeded',
            lastPaymentDate: new Date(),
          },
        })

        // Marquer l'essai comme converti
        await mainPrisma.trial.updateMany({
          where: { userId, isActive: true },
          data: {
            isActive: false,
            convertedToSubscription: true,
            convertedAt: new Date(),
          },
        })

        console.log(`Abonnement créé pour l'utilisateur ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Chercher par customerId ou subscriptionId
        const dbSubscription = await mainPrisma.subscription.findFirst({
          where: {
            OR: [
              { stripeCustomerId: customerId },
              { stripeSubscriptionId: subscription.id },
            ],
          },
        })

        if (dbSubscription) {
          await mainPrisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: subscription.status === 'active' ? 'active' : 
                      subscription.status === 'past_due' ? 'past_due' :
                      subscription.status === 'canceled' ? 'cancelled' : 
                      subscription.status === 'trialing' ? 'trialing' : 'cancelled',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
              stripeSubscriptionId: subscription.id, // S'assurer que l'ID est à jour
            },
          })
          console.log(`Abonnement mis à jour pour le client ${customerId}, statut: ${subscription.status}`)
        } else {
          console.warn(`Abonnement non trouvé pour le client ${customerId} ou subscription ${subscription.id}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const dbSubscription = await mainPrisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          await mainPrisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
            },
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const dbSubscription = await mainPrisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          await mainPrisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              lastPaymentStatus: 'succeeded',
              lastPaymentDate: new Date(),
              status: 'active',
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const dbSubscription = await mainPrisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          await mainPrisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              lastPaymentStatus: 'failed',
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

