import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      repairId,
      customerId,
      userId,
      laborCost,
      partsCost,
      totalCost,
      validUntil,
      notes,
    } = body

    // Récupérer la connexion Prisma de l'entreprise
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Vérifier que la réparation n'a pas déjà un devis
    // Si un devis existe, on le supprime pour le remplacer (régénération)
    const existingQuote = await companyPrisma.quote.findUnique({
      where: { repairId },
    })

    if (existingQuote) {
      // Supprimer l'ancien devis pour le remplacer
      await companyPrisma.quote.delete({
        where: { id: existingQuote.id },
      })
    }

    const quote = await companyPrisma.quote.create({
      data: {
        repairId,
        customerId,
        userId: userId || (session.user as any).id,
        laborCost: parseFloat(laborCost),
        partsCost: parseFloat(partsCost),
        totalCost: parseFloat(totalCost),
        validUntil: new Date(validUntil),
        notes: notes || null,
      },
    })

    return NextResponse.json({ quote }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

