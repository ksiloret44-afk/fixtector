import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'

export async function GET() {
  try {
    // Récupérer uniquement les avis entreprises publics et approuvés
    const mainPrisma = getMainPrisma()

    const reviews = await mainPrisma.companyReview.findMany({
      where: {
        isPublic: true,
        isApproved: true,
        rating: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limiter à 10 avis
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Erreur lors de la récupération des avis publics:', error)
    return NextResponse.json({ reviews: [] })
  }
}

