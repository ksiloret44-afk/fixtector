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

    const adminUser = session.user as any
    if (adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reviewId } = body

    if (!action || !reviewId) {
      return NextResponse.json({ error: 'Action et ID avis requis' }, { status: 400 })
    }

    const prisma = getMainPrisma()

    const review = await prisma.companyReview.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
    }

    let message = ''

    switch (action) {
      case 'approve':
        await prisma.companyReview.update({
          where: { id: reviewId },
          data: {
            isApproved: true,
            isPublic: true,
            approvedAt: new Date(),
            approvedBy: adminUser.id,
          },
        })
        message = 'Avis approuvé et publié.'
        break
      case 'reject':
        await prisma.companyReview.update({
          where: { id: reviewId },
          data: {
            isApproved: true, // Marquer comme traité
            isPublic: false, // Ne pas publier
            approvedAt: new Date(),
            approvedBy: adminUser.id,
          },
        })
        message = 'Avis refusé.'
        break
      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Erreur lors de l\'action sur l\'avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'action' },
      { status: 500 }
    )
  }
}

