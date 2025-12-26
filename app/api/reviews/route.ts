import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma, getCompanyPrisma } from '@/lib/db-manager'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = session.user as any
    const mainPrisma = getMainPrisma()
    
    // Si c'est un admin, récupérer tous les avis de toutes les entreprises
    if (user.role === 'admin') {
      const companies = await mainPrisma.company.findMany()
      let allReviews: any[] = []

      console.log(`[API Reviews] Admin: Récupération des avis pour ${companies.length} entreprises`)

      for (const company of companies) {
        try {
          // Initialiser la base de données si nécessaire
          const { initCompanyDatabase } = await import('@/lib/db-manager')
          try {
            await initCompanyDatabase(company.id)
          } catch (initError) {
            // La base existe peut-être déjà, continuer
            console.log(`[API Reviews] Base déjà initialisée pour ${company.id}`)
          }
          
          const companyPrisma = getCompanyPrisma(company.id)
          const reviews = await companyPrisma.review.findMany({
            select: {
              id: true,
              rating: true,
              comment: true,
              customerName: true,
              reviewToken: true,
              submittedAt: true,
              isApproved: true,
              approvedAt: true,
              rejectedAt: true,
              createdAt: true,
              updatedAt: true,
              repair: {
                select: {
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
            orderBy: { createdAt: 'desc' },
          })
          
          console.log(`[API Reviews] Entreprise ${company.id} (${company.name}): ${reviews.length} avis trouvés`)
          allReviews = [...allReviews, ...reviews]
        } catch (error: any) {
          // Ignorer les erreurs de base de données d'entreprise
          console.error(`[API Reviews] Erreur pour l'entreprise ${company.id}:`, error.message || error)
        }
      }

      console.log(`[API Reviews] Total avis récupérés pour admin: ${allReviews.length}`)
      return NextResponse.json({ reviews: allReviews })
    }

    // Pour les utilisateurs normaux, récupérer les avis de leur entreprise
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Récupérer tous les avis clients finaux
    const reviews = await companyPrisma.review.findMany({
      select: {
        id: true,
        rating: true,
        comment: true,
        customerName: true,
        reviewToken: true,
        submittedAt: true,
        isApproved: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
        updatedAt: true,
        repair: {
          select: {
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
