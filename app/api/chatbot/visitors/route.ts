import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const prisma = getMainPrisma()

    // Récupérer tous les messages généraux (page d'accueil)
    const generalMessages = await prisma.chatbotMessage.findMany({
      where: {
        isGeneral: true,
        role: 'user', // Seulement les messages des visiteurs
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Grouper par email (identifiant unique du visiteur)
    const visitorMap = new Map<string, any>()

    for (const msg of generalMessages) {
      try {
        if (!msg.metadata) continue
        
        const metadata = JSON.parse(msg.metadata)
        const email = metadata.email

        if (!email) continue // Ignorer les messages sans email

        if (!visitorMap.has(email)) {
          visitorMap.set(email, {
            visitorId: email, // Utiliser l'email comme identifiant unique
            visitorName: metadata.firstName && metadata.lastName
              ? `${metadata.firstName} ${metadata.lastName}`
              : metadata.firstName || metadata.lastName || 'Visiteur anonyme',
            firstName: metadata.firstName || '',
            lastName: metadata.lastName || '',
            email: email,
            lastMessage: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            lastMessageTime: msg.createdAt.toISOString(),
            unreadCount: 0, // À implémenter si nécessaire
          })
        } else {
          // Mettre à jour si ce message est plus récent
          const existing = visitorMap.get(email)
          const msgTime = new Date(msg.createdAt).getTime()
          const existingTime = new Date(existing.lastMessageTime).getTime()
          
          if (msgTime > existingTime) {
            existing.lastMessage = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
            existing.lastMessageTime = msg.createdAt.toISOString()
          }
        }
      } catch (e) {
        // Ignorer les messages avec metadata invalide
        console.error('Erreur lors du parsing du metadata:', e)
      }
    }

    // Convertir la Map en tableau
    const chats = Array.from(visitorMap.values())

    // Trier par date du dernier message (plus récent en premier)
    chats.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Erreur lors de la récupération des visiteurs:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}












