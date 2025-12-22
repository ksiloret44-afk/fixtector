import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = session.user as any
    
    // Vérifier que l'utilisateur est un client
    if (user.role !== 'client') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { customerId, rating, comment } = body

    if (!customerId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Vérifier que le customerId correspond à l'utilisateur
    const dbUser = await mainPrisma.user.findUnique({
      where: { id: user.id },
      select: { customerId: true, companyId: true },
    })

    if (!dbUser?.companyId) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas associé à une entreprise' },
        { status: 403 }
      )
    }

    // Vérifier que le customerId existe dans la base de données de l'entreprise
    const companyPrisma = getCompanyPrisma(dbUser.companyId)
    const customer = await companyPrisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Créer l'avis dans la base de données de l'entreprise
    // Le modèle Review nécessite reviewToken et requestedAt
    const reviewToken = `review_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const review = await companyPrisma.review.create({
      data: {
        customerId,
        rating: parseInt(rating),
        comment: comment || null,
        isPublic: false, // Nécessite l'approbation d'un admin
        isApproved: false,
        reviewToken,
        requestedAt: new Date(),
        submittedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Votre avis a été enregistré et sera examiné par notre équipe.',
      reviewId: review.id,
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'avis:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

