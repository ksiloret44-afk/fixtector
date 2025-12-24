import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'

/**
 * API pour permettre aux visiteurs de la landing page de poser des questions
 * Accessible sans authentification - messages généraux (isGeneral: true)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, firstName, lastName, email } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      )
    }

    const prisma = getMainPrisma()

    // Préparer les métadonnées avec les informations du visiteur
    const metadata = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      source: 'landing_page',
    }

    // Sauvegarder le message comme message général (page d'accueil)
    // userId est omis car c'est un visiteur anonyme
    const helpMessage = await prisma.chatbotMessage.create({
      data: {
        role: 'user',
        content: message,
        isGeneral: true, // Message de la page d'accueil
        metadata: JSON.stringify(metadata), // Stocker les infos du visiteur
        // userId et companyId sont omis (null par défaut)
      },
    })

    // Générer une réponse automatique simple
    const response = generateResponse(message)

    // Sauvegarder la réponse automatique
    await prisma.chatbotMessage.create({
      data: {
        role: 'assistant',
        content: response,
        isGeneral: true,
        // userId et companyId sont omis (null par défaut)
      },
    })

    return NextResponse.json({
      success: true,
      response: response,
      message: 'Votre message a été envoyé. Un administrateur vous répondra bientôt si nécessaire.',
      messageId: helpMessage.id,
    })
  } catch (error: any) {
    console.error('Erreur lors de la création du message:', error)
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Réponses simples basées sur des mots-clés
  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
    return 'Bonjour ! Bienvenue sur FixTector. Comment puis-je vous aider aujourd\'hui ?'
  }

  if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('coût') || lowerMessage.includes('abonnement')) {
    return 'FixTector propose un essai gratuit de 24h. Après l\'essai, vous pouvez vous abonner pour continuer à utiliser toutes les fonctionnalités. Consultez nos tarifs sur la page d\'inscription.'
  }

  if (lowerMessage.includes('essai') || lowerMessage.includes('trial') || lowerMessage.includes('gratuit')) {
    return 'Oui ! FixTector propose un essai gratuit de 24h sans engagement. Vous pouvez tester toutes les fonctionnalités. Cliquez sur "Démarrer l\'essai gratuit" pour commencer.'
  }

  if (lowerMessage.includes('fonctionnalité') || lowerMessage.includes('fonction') || lowerMessage.includes('feature')) {
    return 'FixTector offre une solution complète : gestion des réparations, clients, stock, devis, factures, rendez-vous, notifications automatiques, et bien plus. Découvrez toutes les fonctionnalités sur cette page !'
  }

  if (lowerMessage.includes('sécurité') || lowerMessage.includes('sécurisé') || lowerMessage.includes('données')) {
    return 'Vos données sont sécurisées avec FixTector. Chaque entreprise a sa propre base de données isolée, vos données sont chiffrées et sauvegardées automatiquement.'
  }

  if (lowerMessage.includes('installation') || lowerMessage.includes('installer') || lowerMessage.includes('configurer')) {
    return 'Aucune installation requise ! FixTector est 100% cloud. Vous pouvez y accéder depuis n\'importe quel appareil (PC, tablette, smartphone) avec un simple navigateur. Démarrez en 2 minutes !'
  }

  if (lowerMessage.includes('merci') || lowerMessage.includes('thanks')) {
    return 'De rien ! N\'hésitez pas si vous avez d\'autres questions. Vous pouvez également démarrer votre essai gratuit pour découvrir FixTector par vous-même.'
  }

  // Réponse par défaut
  return 'Merci pour votre question ! Un administrateur vous répondra bientôt. En attendant, vous pouvez découvrir toutes les fonctionnalités de FixTector sur cette page ou démarrer votre essai gratuit.'
}

