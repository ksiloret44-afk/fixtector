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

    const user = session.user as any
    
    // Seuls les utilisateurs non-admin peuvent laisser un avis
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const prisma = getMainPrisma()

    const review = await prisma.companyReview.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ review: review || null })
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

