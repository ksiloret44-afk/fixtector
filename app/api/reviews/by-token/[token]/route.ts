import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Erreur de connexion' },
        { status: 500 }
      )
    }

    const review = await companyPrisma.review.findUnique({
      where: { reviewToken: params.token },
      include: {
        repair: {
          select: {
            id: true,
            deviceType: true,
            brand: true,
            model: true,
            ticketNumber: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerName,
      repair: review.repair,
      customer: review.customer,
      submittedAt: review.submittedAt,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json()
    const { rating, comment, customerName } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Note invalide (doit être entre 1 et 5)' },
        { status: 400 }
      )
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Erreur de connexion' },
        { status: 500 }
      )
    }

    const review = await companyPrisma.review.findUnique({
      where: { reviewToken: params.token },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      )
    }

    if (review.rating > 0) {
      return NextResponse.json(
        { error: 'Cet avis a déjà été soumis' },
        { status: 400 }
      )
    }

    // Mettre à jour l'avis
    await companyPrisma.review.update({
      where: { id: review.id },
      data: {
        rating,
        comment: comment || null,
        customerName: customerName || null,
        submittedAt: new Date(),
        isPublic: true, // Par défaut public, l'admin peut désapprouver
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Avis enregistré avec succès',
    })
  } catch (error) {
    console.error('Erreur lors de la soumission de l\'avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la soumission de l\'avis' },
      { status: 500 }
    )
  }
}

