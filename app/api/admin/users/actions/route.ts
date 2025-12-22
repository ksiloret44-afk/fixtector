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
    const { action, userId } = body

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Action et userId requis' },
        { status: 400 }
      )
    }

    const prisma = getMainPrisma()

    switch (action) {
      case 'convert_to_subscription': {
        // Convertir un essai en abonnement actif
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { trial: true, subscription: true },
        })

        if (!user) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
        }

        // Si l'utilisateur a déjà un abonnement, ne rien faire
        if (user.subscription) {
          return NextResponse.json({ error: 'L\'utilisateur a déjà un abonnement' }, { status: 400 })
        }

        // Créer un abonnement actif
        await prisma.subscription.create({
          data: {
            userId: user.id,
            status: 'active',
            plan: 'basic',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        })

        // Désactiver l'essai s'il existe
        if (user.trial) {
          await prisma.trial.update({
            where: { id: user.trial.id },
            data: {
              isActive: false,
              convertedToSubscription: true,
              convertedAt: new Date(),
            },
          })
        }

        return NextResponse.json({ success: true, message: 'Essai converti en abonnement actif' })
      }

      case 'convert_to_trial': {
        // Convertir un abonnement en essai 24h
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { trial: true, subscription: true },
        })

        if (!user) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
        }

        // Supprimer l'abonnement s'il existe
        if (user.subscription) {
          await prisma.subscription.delete({
            where: { id: user.subscription.id },
          })
        }

        // Créer ou réactiver un essai
        if (user.trial) {
          await prisma.trial.update({
            where: { id: user.trial.id },
            data: {
              isActive: true,
              startedAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
              convertedToSubscription: false,
              convertedAt: null,
            },
          })
        } else {
          await prisma.trial.create({
            data: {
              userId: user.id,
              startedAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              isActive: true,
              welcomeMessageShown: false,
            },
          })
        }

        return NextResponse.json({ success: true, message: 'Abonnement converti en essai 24h' })
      }

      case 'delete': {
        // Supprimer un utilisateur
        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
        }

        // Ne pas permettre la suppression d'un admin
        if (user.role === 'admin') {
          return NextResponse.json({ error: 'Impossible de supprimer un administrateur' }, { status: 403 })
        }

        await prisma.user.delete({
          where: { id: userId },
        })

        return NextResponse.json({ success: true, message: 'Utilisateur supprimé' })
      }

      case 'create_trial': {
        // Créer un essai pour un utilisateur qui n'en a pas
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { trial: true },
        })

        if (!user) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
        }

        if (user.trial) {
          return NextResponse.json({ error: 'L\'utilisateur a déjà un essai' }, { status: 400 })
        }

        await prisma.trial.create({
          data: {
            userId: user.id,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
            welcomeMessageShown: false,
          },
        })

        return NextResponse.json({ success: true, message: 'Essai 24h créé' })
      }

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'action:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

