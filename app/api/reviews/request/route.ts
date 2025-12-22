import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { repairId, customerId } = body

    if (!repairId && !customerId) {
      return NextResponse.json(
        { error: 'repairId ou customerId requis' },
        { status: 400 }
      )
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Vérifier que la réparation existe et appartient à l'entreprise
    let customer
    if (repairId) {
      const repair = await companyPrisma.repair.findUnique({
        where: { id: repairId },
        include: { customer: true },
      })

      if (!repair) {
        return NextResponse.json(
          { error: 'Réparation non trouvée' },
          { status: 404 }
        )
      }

      customer = repair.customer
    } else {
      customer = await companyPrisma.customer.findUnique({
        where: { id: customerId },
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Client non trouvé' },
          { status: 404 }
        )
      }
    }

    // Générer un token unique pour la demande d'avis
    const reviewToken = crypto.randomBytes(32).toString('hex')

    // Créer la demande d'avis
    const review = await companyPrisma.review.create({
      data: {
        repairId: repairId || null,
        customerId: customer.id,
        rating: 0, // Pas encore noté
        reviewToken,
      },
    })

    // Générer le lien de demande d'avis
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reviewUrl = `${baseUrl}/review/${reviewToken}`

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      reviewToken,
      reviewUrl,
      message: 'Demande d\'avis créée avec succès',
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de la demande d\'avis:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la demande d\'avis' },
      { status: 500 }
    )
  }
}

