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

    // Déterminer si le message est général ou spécifique à une entreprise
    // Si companyId est fourni, c'est un message d'entreprise (isGeneral = false)
    // Si visitorEmail est fourni, c'est un message de visiteur (isGeneral = true)
    // Sinon, utiliser la valeur par défaut
    let finalIsGeneral = isGeneral
    if (companyId) {
      finalIsGeneral = false // Les messages d'entreprise ne sont pas généraux
    } else if (visitorEmail) {
      finalIsGeneral = true // Les messages de visiteurs sont généraux
    }

    // Quand l'admin répond, son message est directement une réponse (assistant)
    // Pas besoin de générer une réponse automatique, l'admin écrit directement sa réponse
    const createdMessage = await prisma.chatbotMessage.create({
      data: {
        userId,
        role: 'assistant', // Les messages de l'admin sont des réponses (assistant)
        content: message,
        companyId: companyId || null,
        isGeneral: finalIsGeneral,
        metadata: metadata,
      },
    })

    console.log('Message admin créé:', {
      id: createdMessage.id,
      companyId: createdMessage.companyId,
      isGeneral: createdMessage.isGeneral,
      role: createdMessage.role,
    })

    return NextResponse.json({ response: message })
  } catch (error) {
    console.error('Erreur lors du chat:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}


