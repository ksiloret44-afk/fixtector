import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

/**
 * API pour permettre aux clients connectés d'envoyer et récupérer leurs propres messages
 * Les messages des clients ne sont visibles que par eux-mêmes, pas par les admins
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const prisma = getMainPrisma()

    // Récupérer le companyId de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    })

    const companyId = user?.companyId || null

    if (!companyId) {
      // Si l'utilisateur n'a pas de companyId, retourner un tableau vide
      return NextResponse.json({ messages: [] })
    }

    // Récupérer tous les messages de cette entreprise (utilisateur ET admin)
    // Les messages des entreprises ont companyId non null et isGeneral = false
    // On ne filtre PAS par userId pour inclure les réponses de l'admin
    const messages = await prisma.chatbotMessage.findMany({
      where: {
        companyId: companyId, // Récupérer tous les messages de cette entreprise
        isGeneral: false, // Les messages des entreprises ne sont pas généraux
        // Pas de filtre userId pour inclure les messages de l'utilisateur ET de l'admin
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const prisma = getMainPrisma()

    // Récupérer le companyId de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    })

    const companyId = user?.companyId || null

    // Sauvegarder le message de l'utilisateur avec le companyId
    // Les messages des entreprises ont userId non null, isGeneral = false, et companyId non null
    await prisma.chatbotMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        isGeneral: false, // Les messages des entreprises ne sont pas généraux
        companyId: companyId, // Inclure le companyId pour que l'admin puisse voir les messages
      },
    })

    // Ne pas générer de réponse automatique - l'admin répondra
    // Juste confirmer que le message a été envoyé

    return NextResponse.json({ 
      success: true,
      message: 'Votre message a été envoyé. Un administrateur vous répondra bientôt.',
    })
  } catch (error) {
    console.error('Erreur lors du chat:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}


