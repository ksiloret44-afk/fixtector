import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Cache les stats pendant 30 secondes (pour les admins)
export const revalidate = 30
export const dynamic = 'force-dynamic' // Nécessaire pour l'authentification

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    
    // Optimisation: une seule requête avec groupBy serait mieux, mais count est déjà optimisé
    // Utiliser Promise.all pour paralléliser les requêtes
    const [totalUsers, approvedUsers, pendingUsers, adminUsers] = await Promise.all([
      mainPrisma.user.count(),
      mainPrisma.user.count({ where: { approved: true } }),
      mainPrisma.user.count({ where: { approved: false } }),
      mainPrisma.user.count({ where: { role: 'admin' } }),
    ])

    // Ajouter les headers de cache
    return NextResponse.json(
      {
        totalUsers,
        approvedUsers,
        pendingUsers,
        adminUsers,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

