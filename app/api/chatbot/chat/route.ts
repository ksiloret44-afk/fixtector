import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { message, companyId, visitorEmail, isGeneral = true } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const prisma = getMainPrisma()

    // Préparer les métadonnées si c'est une réponse à un visiteur
    let metadata = null
    if (visitorEmail) {
      // Récupérer les infos du visiteur depuis un de ses messages précédents
      const visitorMessage = await prisma.chatbotMessage.findFirst({
        where: {
          isGeneral: true,
          metadata: {
            contains: `"email":"${visitorEmail}"`
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      if (visitorMessage?.metadata) {
        metadata = visitorMessage.metadata // Conserver les mêmes métadonnées pour lier la conversation
      }
    }

    // Sauvegarder le message de l'utilisateur
    await prisma.chatbotMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        companyId: companyId || null,
        isGeneral: isGeneral === true || visitorEmail !== undefined,
        metadata: metadata,
      },
    })

    // Générer une réponse simple (à améliorer avec une vraie IA plus tard)
    const response = generateResponse(message)

    // Sauvegarder la réponse
    await prisma.chatbotMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: response,
        companyId: companyId || null,
        isGeneral: isGeneral === true || visitorEmail !== undefined,
        metadata: metadata,
      },
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Erreur lors du chat:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Réponses simples basées sur des mots-clés
  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
    return 'Bonjour ! Comment puis-je vous aider aujourd\'hui avec FixTector ?'
  }

  if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
    return 'Je peux vous aider avec :\n- Les fonctionnalités de FixTector\n- La gestion des réparations\n- Les abonnements et essais\n- Les paramètres\n\nQue souhaitez-vous savoir ?'
  }

  if (lowerMessage.includes('réparation') || lowerMessage.includes('repair')) {
    return 'FixTector permet de gérer vos réparations de A à Z : création de tickets, suivi des statuts, gestion des pièces, photos, devis et factures. Vous pouvez créer une nouvelle réparation depuis le menu "Réparations".'
  }

  if (lowerMessage.includes('abonnement') || lowerMessage.includes('subscription') || lowerMessage.includes('essai')) {
    return 'FixTector propose un essai gratuit de 24h. Après l\'essai, vous pouvez vous abonner pour continuer à utiliser toutes les fonctionnalités. Consultez la page "Abonnements" pour plus d\'informations.'
  }

  if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
    return 'Vous pouvez gérer vos clients depuis le menu "Clients". Ajoutez des clients, consultez leur historique de réparations, et gérez leurs informations de contact.'
  }

  if (lowerMessage.includes('facture') || lowerMessage.includes('invoice') || lowerMessage.includes('devis') || lowerMessage.includes('quote')) {
    return 'FixTector génère automatiquement des devis et factures conformes à la législation européenne. Les documents incluent toutes les mentions légales obligatoires et peuvent être exportés en PDF.'
  }

  if (lowerMessage.includes('merci') || lowerMessage.includes('thanks')) {
    return 'De rien ! N\'hésitez pas si vous avez d\'autres questions.'
  }

  // Réponse par défaut
  return 'Je comprends votre question. Pour une assistance plus détaillée, consultez la documentation ou contactez le support. Je peux vous aider avec les fonctionnalités principales de FixTector : réparations, clients, stock, devis, factures, et abonnements.'
}

