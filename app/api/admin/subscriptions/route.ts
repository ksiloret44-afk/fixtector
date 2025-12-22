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

    const users = await prisma.user.findMany({
      where: {
        role: { not: 'admin' }, // Exclure les admins
      },
      include: {
        subscription: true,
        trial: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formater les données pour le frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      subscription: user.subscription ? {
        id: user.subscription.id,
        status: user.subscription.status,
        plan: user.subscription.plan,
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() || null,
        stripeCustomerId: user.subscription.stripeCustomerId,
      } : null,
      trial: user.trial ? {
        id: user.trial.id,
        expiresAt: user.trial.expiresAt.toISOString(),
        isActive: user.trial.isActive,
        welcomeMessageShown: user.trial.welcomeMessageShown,
      } : null,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnements:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

