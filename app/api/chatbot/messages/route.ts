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

    let messages: any[] = []
    
    if (visitorEmail) {
      // Messages d'un visiteur spécifique (par email)
      // Récupérer TOUS les messages généraux (visiteur ET admin) sans filtre userId
      // pour inclure les réponses de l'admin qui ont le même metadata
      messages = await prisma.chatbotMessage.findMany({
        where: {
          isGeneral: true,
          // Pas de filtre userId pour inclure les messages de l'admin
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      })
    } else {
      let where: any = {}
      
      if (companyId) {
        // Messages d'une entreprise spécifique
        where.companyId = companyId
        where.isGeneral = false
        // Ne pas filtrer par userId pour inclure les réponses de l'admin
      } else if (general) {
        // Messages généraux (page d'accueil) - tous les visiteurs
        // Exclure les messages des clients connectés (userId non null) mais inclure les réponses de l'admin
        where.isGeneral = true
        where.userId = null // Seulement pour la vue générale, pas pour un visiteur spécifique
      } else {
        // Par défaut, messages généraux
        where.isGeneral = true
        where.userId = null // Seulement pour la vue générale
      }

      messages = await prisma.chatbotMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: 200,
      })
    }

    // Filtrer par email si visitorEmail est spécifié (pour une recherche plus précise dans le JSON)
    if (visitorEmail) {
      const normalizedEmail = visitorEmail.toLowerCase().trim()
      messages = messages.filter(msg => {
        if (!msg.metadata) return false
        try {
          const metadata = JSON.parse(msg.metadata)
          // Normaliser l'email du metadata pour la comparaison
          const metadataEmail = metadata.email ? metadata.email.toLowerCase().trim() : null
          return metadataEmail === normalizedEmail
        } catch {
          // Si le parsing échoue, faire une recherche simple dans la chaîne
          return msg.metadata.toLowerCase().includes(normalizedEmail)
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

