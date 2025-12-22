import { NextResponse } from 'next/server'
import { getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
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
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        })

        if (review) {
          return NextResponse.json({
            review: {
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              submittedAt: review.submittedAt,
            },
            repair: review.repair ? {
              id: review.repair.id,
              ticketNumber: review.repair.ticketNumber,
              deviceType: review.repair.deviceType,
              brand: review.repair.brand,
              model: review.repair.model,
              customerName: `${review.repair.customer.firstName} ${review.repair.customer.lastName}`,
            } : null,
          })
        }
      } catch (error) {
        // Continuer à chercher dans les autres bases
        continue
      }
    }

    return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

