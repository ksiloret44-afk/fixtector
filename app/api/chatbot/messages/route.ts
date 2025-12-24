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
    const visitorEmail = searchParams.get('visitorEmail')

    const prisma = getMainPrisma()

    let where: any = {}
    
    if (visitorEmail) {
      // Messages d'un visiteur spécifique (par email)
      // Récupérer tous les messages généraux puis filtrer par email dans le metadata
      where.isGeneral = true
      where.metadata = {
        contains: visitorEmail // Recherche simple dans le JSON
      }
    } else if (companyId) {
      // Messages d'une entreprise spécifique
      where.companyId = companyId
      where.isGeneral = false
    } else if (general) {
      // Messages généraux (page d'accueil) - tous les visiteurs
      where.isGeneral = true
    } else {
      // Par défaut, messages généraux
      where.isGeneral = true
    }

    let messages = await prisma.chatbotMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200, // Prendre plus pour filtrer ensuite
    })

    // Filtrer par email si visitorEmail est spécifié (pour une recherche plus précise dans le JSON)
    if (visitorEmail) {
      messages = messages.filter(msg => {
        if (!msg.metadata) return false
        try {
          const metadata = JSON.parse(msg.metadata)
          return metadata.email === visitorEmail
        } catch {
          return msg.metadata.includes(visitorEmail)
        }
      })
    }

    // Limiter à 100 après filtrage
    messages = messages.slice(0, 100)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

