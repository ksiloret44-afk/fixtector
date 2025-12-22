import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const [totalUsers, approvedUsers, pendingUsers, adminUsers] = await Promise.all([
      mainPrisma.user.count(),
      mainPrisma.user.count({ where: { approved: true } }),
      mainPrisma.user.count({ where: { approved: false } }),
      mainPrisma.user.count({ where: { role: 'admin' } }),
    ])

    return NextResponse.json({
      totalUsers,
      approvedUsers,
      pendingUsers,
      adminUsers,
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

