import { NextResponse } from 'next/server'
import { getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, rating, comment } = body

    if (!token || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    // Chercher l'avis dans toutes les bases de données d'entreprises
    const mainPrisma = getMainPrisma()
    const companies = await mainPrisma.company.findMany()

    for (const company of companies) {
      try {
        const companyPrisma = getCompanyPrisma(company.id)
        
        const review = await companyPrisma.review.findUnique({
          where: { reviewToken: token },
          include: {
            repair: {
              include: {
                customer: true,
              },
            },
          },
        })

        if (review) {
          // Mettre à jour l'avis
          const updatedReview = await companyPrisma.review.update({
            where: { id: review.id },
            data: {
              rating: parseInt(rating),
              comment: comment || null,
              submittedAt: new Date(),
              customerName: review.repair
                ? `${review.repair.customer.firstName} ${review.repair.customer.lastName}`
                : null,
            },
          })

          return NextResponse.json({
            success: true,
            message: 'Votre avis a été enregistré avec succès.',
            review: updatedReview,
          })
        }
      } catch (error) {
        // Continuer à chercher dans les autres bases
        continue
      }
    }

    return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
  } catch (error: any) {
    console.error('Erreur lors de la soumission de l\'avis:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

