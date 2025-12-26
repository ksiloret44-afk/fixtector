import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'

/**
 * API pour permettre aux visiteurs de récupérer leurs messages depuis la landing page
 * Accessible sans authentification - récupère les messages par email
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
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
    const normalizedEmail = email.toLowerCase().trim()

    // Récupérer tous les messages généraux (page d'accueil) qui correspondent à cet email
    // Cela inclut les messages du visiteur (userId: null) ET les réponses de l'admin (userId non null)
    const allMessages = await prisma.chatbotMessage.findMany({
      where: {
        isGeneral: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    // Filtrer pour ne garder que ceux qui correspondent exactement à cet email
    const visitorMessages = allMessages.filter(msg => {
      if (!msg.metadata) return false
      try {
        const metadata = JSON.parse(msg.metadata)
        return metadata.email && metadata.email.toLowerCase().trim() === normalizedEmail
      } catch {
        // Si le parsing échoue, faire une recherche simple
        return msg.metadata.toLowerCase().includes(normalizedEmail)
      }
    })

    // Limiter à 100 messages
    const limitedMessages = visitorMessages.slice(0, 100)

    // Formater les messages pour le client
    const formattedMessages = limitedMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
