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

    // Valider que les informations utilisateur sont présentes
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Nom, prénom et email sont requis' },
        { status: 400 }
      )
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    const prisma = getMainPrisma()

    // Préparer les métadonnées avec les informations du visiteur
    const metadata = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      source: 'landing_page',
    }

    // Vérifier si c'est le premier message de ce visiteur
    const existingMessages = await prisma.chatbotMessage.findMany({
      where: {
        isGeneral: true,
        userId: null,
        metadata: {
          contains: `"email":"${metadata.email}"`
        }
      },
      take: 1
    })

    const isFirstMessage = existingMessages.length === 0

    // Sauvegarder le message du visiteur
    await prisma.chatbotMessage.create({
      data: {
        role: 'user',
        content: message,
        isGeneral: true,
        metadata: JSON.stringify(metadata),
      },
    })

    // Générer une réponse automatique uniquement si c'est le premier message
    let response = null
    if (isFirstMessage) {
      response = 'Merci pour votre question ! Un administrateur vous répondra bientôt. En attendant, vous pouvez découvrir toutes les fonctionnalités de FixTector sur cette page ou démarrer votre essai gratuit.'
      
      // Sauvegarder la réponse automatique
      await prisma.chatbotMessage.create({
        data: {
          role: 'assistant',
          content: response,
          isGeneral: true,
          metadata: JSON.stringify(metadata),
        },
      })
    }

    return NextResponse.json({
      success: true,
      response: response, // null si ce n'est pas le premier message
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
