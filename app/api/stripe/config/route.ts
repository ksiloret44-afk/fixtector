import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier que l'utilisateur est admin
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    const mainPrisma = getMainPrisma()
    
    // Récupérer ou créer la configuration Stripe
    let config = await mainPrisma.stripeConfig.findUnique({
      where: { key: 'stripe_config' },
    })

    if (!config) {
      // Créer une configuration par défaut
      config = await mainPrisma.stripeConfig.create({
        data: {
          key: 'stripe_config',
          isActive: false,
        },
      })
    }

    return NextResponse.json({
      config: {
        publishableKey: config.publishableKey || '',
        secretKey: config.secretKey ? '***configured***' : '', // Indicateur que la clé est configurée
        webhookSecret: config.webhookSecret ? '***configured***' : '', // Indicateur que le secret est configuré
        isActive: config.isActive,
        hasSecretKey: !!config.secretKey,
        hasWebhookSecret: !!config.webhookSecret,
      },
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la config Stripe:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier que l'utilisateur est admin
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    const body = await req.json()
    let { publishableKey, secretKey, webhookSecret, isActive } = body

    const mainPrisma = getMainPrisma()
    
    // Nettoyer les clés (supprimer les espaces, retours à la ligne, etc.)
    if (publishableKey) publishableKey = publishableKey.trim()
    if (secretKey) secretKey = secretKey.trim()
    if (webhookSecret) webhookSecret = webhookSecret.trim()
    
    // Valider le format des clés
    if (publishableKey && !publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
      return NextResponse.json(
        { error: 'Format de clé publique Stripe invalide. La clé doit commencer par pk_test_ ou pk_live_' },
        { status: 400 }
      )
    }
    
    if (secretKey && secretKey !== '' && !secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      return NextResponse.json(
        { error: 'Format de clé secrète Stripe invalide. La clé doit commencer par sk_test_ ou sk_live_' },
        { status: 400 }
      )
    }
    
    if (webhookSecret && webhookSecret !== '' && !webhookSecret.startsWith('whsec_')) {
      return NextResponse.json(
        { error: 'Format de secret webhook Stripe invalide. Le secret doit commencer par whsec_' },
        { status: 400 }
      )
    }
    
    // Récupérer la configuration actuelle pour préserver les clés secrètes si elles ne sont pas fournies
    const existingConfig = await mainPrisma.stripeConfig.findUnique({
      where: { key: 'stripe_config' },
    })

    // Mettre à jour ou créer la configuration
    const config = await mainPrisma.stripeConfig.upsert({
      where: { key: 'stripe_config' },
      update: {
        publishableKey: publishableKey || null,
        // Ne mettre à jour la clé secrète que si une nouvelle valeur est fournie
        secretKey: secretKey && secretKey !== '' ? secretKey : (existingConfig?.secretKey || null),
        // Ne mettre à jour le webhook secret que si une nouvelle valeur est fournie
        webhookSecret: webhookSecret && webhookSecret !== '' ? webhookSecret : (existingConfig?.webhookSecret || null),
        isActive: isActive || false,
      },
      create: {
        key: 'stripe_config',
        publishableKey: publishableKey || null,
        secretKey: secretKey && secretKey !== '' ? secretKey : null,
        webhookSecret: webhookSecret && webhookSecret !== '' ? webhookSecret : null,
        isActive: isActive || false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration Stripe enregistrée avec succès',
    })
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde de la config Stripe:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

