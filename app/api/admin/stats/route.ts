import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const [totalUsers, approvedUsers, pendingUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { approved: true } }),
      prisma.user.count({ where: { approved: false } }),
      prisma.user.count({ where: { role: 'admin' } }),
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

