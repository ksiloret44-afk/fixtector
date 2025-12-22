import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma, getUserPrisma } from '@/lib/db-manager'

/**
 * API pour permettre aux entreprises de créer une demande d'aide
 * Accessible depuis leur interface (pas seulement admin)
 */
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

    // Récupérer l'entreprise de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    })

    if (!user?.companyId) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Sauvegarder le message de demande d'aide
    const helpMessage = await prisma.chatbotMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
        companyId: user.companyId,
        isGeneral: false, // C'est une demande d'aide d'entreprise
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Votre demande d\'aide a été envoyée. Un administrateur vous répondra bientôt.',
      messageId: helpMessage.id,
    })
  } catch (error) {
    console.error('Erreur lors de la création de la demande d\'aide:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

