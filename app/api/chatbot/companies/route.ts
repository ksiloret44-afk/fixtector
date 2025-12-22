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

    // Récupérer toutes les entreprises qui ont des messages de demande d'aide
    const companiesWithMessages = await prisma.chatbotMessage.findMany({
      where: {
        isGeneral: false,
        companyId: { not: null },
      },
      select: {
        companyId: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Grouper par entreprise et récupérer les infos
    const companyMap = new Map<string, any>()

    for (const msg of companiesWithMessages) {
      if (!msg.companyId) continue

      if (!companyMap.has(msg.companyId)) {
        const company = await prisma.company.findUnique({
          where: { id: msg.companyId },
          select: { id: true, name: true },
        })

        if (company) {
          companyMap.set(msg.companyId, {
            companyId: company.id,
            companyName: company.name,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt.toISOString(),
            unreadCount: 0, // À implémenter si nécessaire
          })
        }
      }
    }

    // Convertir la Map en tableau
    const chats = Array.from(companyMap.values())

    // Trier par date du dernier message (plus récent en premier)
    chats.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

