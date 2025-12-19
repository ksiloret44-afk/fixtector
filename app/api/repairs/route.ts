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
      userId,
      customerId,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerEmail,
      deviceType,
      repairType,
      brand,
      model,
      serialNumber,
      imei,
      issue,
      estimatedCost,
      estimatedTime,
      notes,
    } = body

    // Créer ou récupérer le client
    let finalCustomerId = customerId

    if (!finalCustomerId) {
      if (!customerFirstName || !customerLastName || !customerPhone) {
        return NextResponse.json(
          { error: 'Les informations client sont requises' },
          { status: 400 }
        )
      }

      const customer = await prisma.customer.create({
        data: {
          firstName: customerFirstName,
          lastName: customerLastName,
          phone: customerPhone,
          email: customerEmail || null,
        },
      })

      finalCustomerId = customer.id
    }

    // Construire la description du problème avec le type de réparation
    let finalIssue = issue
    if (repairType) {
      finalIssue = `Type de réparation: ${repairType}\n\n${issue || 'Aucune description supplémentaire.'}`
    }

    // Construire les notes avec l'IMEI si renseigné
    let finalNotes = notes || ''
    if (imei) {
      if (finalNotes) {
        finalNotes = `${finalNotes}\n\nIMEI: ${imei}`
      } else {
        finalNotes = `IMEI: ${imei}`
      }
    }

    // Créer la réparation
    const repair = await prisma.repair.create({
      data: {
        customerId: finalCustomerId,
        userId,
        deviceType,
        brand,
        model,
        serialNumber: serialNumber || null,
        issue: finalIssue,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        estimatedTime: estimatedTime || null,
        notes: finalNotes || null,
        status: 'pending',
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json({ repair }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

