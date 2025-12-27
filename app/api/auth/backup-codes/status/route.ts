import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/auth/backup-codes/status
 * Récupère le nombre de codes de secours restants pour l'utilisateur connecté
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const mainPrisma = getMainPrisma()
    const userId = (session.user as any).id

    // Compter les codes de secours non utilisés
    const remaining = await mainPrisma.twoFactorBackupCode.count({
      where: {
        userId,
        used: false,
      },
    })

    return NextResponse.json({
      remaining,
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération du statut des codes de secours:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}


