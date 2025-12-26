import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'approve' ou 'reject'

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "approve" ou "reject"' },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const companyPrisma = await getUserPrisma()

    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Vérifier que l'avis existe
    const review = await companyPrisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour l'avis
    if (action === 'approve') {
      await companyPrisma.review.update({
        where: { id: params.id },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: userId,
          rejectedAt: null,
          rejectedBy: null,
        },
      })
    } else {
      await companyPrisma.review.update({
        where: { id: params.id },
        data: {
          isApproved: false,
          rejectedAt: new Date(),
          rejectedBy: userId,
          approvedAt: null,
          approvedBy: null,
        },
      })
    }

    return NextResponse.json({ 
      success: true,
      message: action === 'approve' ? 'Avis approuvé' : 'Avis rejeté'
    })
  } catch (error: any) {
    console.error('Erreur lors de la modération de l\'avis:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}



