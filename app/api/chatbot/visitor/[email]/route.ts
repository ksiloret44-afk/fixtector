import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

/**
 * API pour supprimer tous les messages d'un visiteur (fermer/réinitialiser sa session)
 * Accessible uniquement aux admins
 */
export async function DELETE(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const email = decodeURIComponent(params.email)
    const normalizedEmail = email.toLowerCase().trim()
    const prisma = getMainPrisma()

    // Récupérer TOUS les messages associés à cet email (visiteur ET admin)
    // On ne filtre pas par userId pour inclure aussi les réponses de l'admin
    const allMessages = await prisma.chatbotMessage.findMany({
      where: {
        isGeneral: true,
        // Pas de filtre userId pour inclure les messages de l'admin aussi
      },
      take: 500, // Prendre plus pour être sûr de tout récupérer
    })

    // Filtrer pour ne garder que ceux qui correspondent exactement à cet email dans le metadata
    const messagesToDelete = allMessages.filter(msg => {
      if (!msg.metadata) return false
      try {
        const metadata = JSON.parse(msg.metadata)
        const metadataEmail = metadata.email ? metadata.email.toLowerCase().trim() : null
        return metadataEmail === normalizedEmail
      } catch {
        // Si le parsing échoue, faire une recherche simple dans la chaîne
        return msg.metadata.toLowerCase().includes(normalizedEmail)
      }
    })

    // Supprimer tous les messages (visiteur ET admin) associés à cet email
    if (messagesToDelete.length > 0) {
      await prisma.chatbotMessage.deleteMany({
        where: {
          id: {
            in: messagesToDelete.map(m => m.id)
          }
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: messagesToDelete.length 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression des messages:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

