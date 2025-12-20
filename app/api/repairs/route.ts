import { NextResponse } from 'next/server'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendRepairStatusNotification } from '@/lib/notifications'

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

    // Récupérer la connexion Prisma de l'entreprise de l'utilisateur
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise pour créer une réparation' },
        { status: 403 }
      )
    }

    // Créer ou récupérer le client
    let finalCustomerId = customerId

    if (!finalCustomerId) {
      if (!customerFirstName || !customerLastName || !customerPhone) {
        return NextResponse.json(
          { error: 'Les informations client sont requises' },
          { status: 400 }
        )
      }

      const customer = await companyPrisma.customer.create({
        data: {
          firstName: customerFirstName,
          lastName: customerLastName,
          phone: customerPhone,
          email: customerEmail || null,
        },
      })

      finalCustomerId = customer.id
    } else {
      // Vérifier que le client existe dans cette base
      const existingCustomer = await companyPrisma.customer.findUnique({
        where: { id: finalCustomerId },
      })

      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Ce client n\'appartient pas à votre entreprise' },
          { status: 403 }
        )
      }
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
    const repair = await companyPrisma.repair.create({
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

    // Envoyer une notification de création
    try {
      const mainPrisma = getMainPrisma()
      const user = await mainPrisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
      })

      await sendRepairStatusNotification(companyPrisma, {
        customerName: `${repair.customer.firstName} ${repair.customer.lastName}`,
        customerEmail: repair.customer.email || undefined,
        customerPhone: repair.customer.phone,
        repairId: repair.id,
        ticketNumber: repair.ticketNumber,
        deviceType: repair.deviceType,
        brand: repair.brand,
        model: repair.model,
        status: 'pending',
        estimatedCost: repair.estimatedCost || undefined,
        estimatedTime: repair.estimatedTime || undefined,
        notes: repair.notes || undefined,
        companyName: user?.company?.name,
      })
    } catch (error) {
      // Ne pas faire échouer la requête si la notification échoue
      console.error('Erreur lors de l\'envoi de la notification:', error)
    }

    return NextResponse.json({ repair }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

