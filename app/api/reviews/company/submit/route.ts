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

    const user = session.user as any
    
    // Seuls les utilisateurs non-admin peuvent laisser un avis
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    const prisma = getMainPrisma()

    // Récupérer les infos de l'entreprise
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true },
    })

    // Vérifier si un avis existe déjà
    const existingReview = await prisma.companyReview.findFirst({
      where: { userId: user.id },
    })

    if (existingReview) {
      // Mettre à jour l'avis existant
      await prisma.companyReview.update({
        where: { id: existingReview.id },
        data: {
          rating: parseInt(rating),
          comment: comment || null,
          companyName: dbUser?.company?.name || null,
          isPublic: false, // Réinitialiser l'approbation
          isApproved: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Votre avis a été modifié et sera examiné à nouveau par notre équipe.',
      })
    } else {
      // Créer un nouvel avis
      await prisma.companyReview.create({
        data: {
          userId: user.id,
          companyId: dbUser?.companyId || null,
          rating: parseInt(rating),
          comment: comment || null,
          companyName: dbUser?.company?.name || null,
          isPublic: false,
          isApproved: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Votre avis a été enregistré et sera examiné par notre équipe avant publication.',
      })
    }
  } catch (error: any) {
    console.error('Erreur lors de la soumission de l\'avis:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

