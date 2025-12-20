import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const general = searchParams.get('general') === 'true'
    const companyId = searchParams.get('companyId')

    const prisma = getMainPrisma()

    let where: any = {}
    
    if (general) {
      // Messages généraux (page d'accueil)
      where.isGeneral = true
    } else if (companyId) {
      // Messages d'une entreprise spécifique
      where.companyId = companyId
      where.isGeneral = false
    } else {
      // Par défaut, messages généraux
      where.isGeneral = true
    }

    const messages = await prisma.chatbotMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100, // Limiter à 100 derniers messages
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

