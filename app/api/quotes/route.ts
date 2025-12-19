import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Vérifier que la réparation n'a pas déjà un devis
    const existingQuote = await prisma.quote.findUnique({
      where: { repairId },
    })

    if (existingQuote) {
      return NextResponse.json(
        { error: 'Cette réparation a déjà un devis' },
        { status: 400 }
      )
    }

    const quote = await prisma.quote.create({
      data: {
        repairId,
        customerId,
        userId,
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

