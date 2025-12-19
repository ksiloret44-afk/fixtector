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
      taxRate,
      taxAmount,
      finalAmount,
      notes,
    } = body

    if (!repairId || !customerId || !userId) {
      return NextResponse.json(
        { error: 'Les champs requis sont manquants' },
        { status: 400 }
      )
    }

    // Vérifier si une facture existe déjà pour cette réparation
    const existingInvoice = await prisma.invoice.findUnique({
      where: { repairId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Une facture existe déjà pour cette réparation' },
        { status: 400 }
      )
    }

    // Créer la facture
    const invoice = await prisma.invoice.create({
      data: {
        repairId,
        customerId,
        userId,
        laborCost: parseFloat(laborCost),
        partsCost: parseFloat(partsCost),
        totalCost: parseFloat(totalCost),
        taxRate: parseFloat(taxRate) || 20.0,
        taxAmount: parseFloat(taxAmount),
        finalAmount: parseFloat(finalAmount),
        paymentStatus: 'unpaid',
        notes: notes || null,
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error: any) {
    console.error('Erreur lors de la création:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une facture existe déjà pour cette réparation' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

