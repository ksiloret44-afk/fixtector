import { NextResponse } from 'next/server'
import { getUserPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendRepairStatusNotification } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      status, 
      finalCost, 
      internalNotes,
      deviceType,
      brand,
      model,
      serialNumber,
      issue,
      estimatedCost,
      estimatedTime,
      notes,
    } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (deviceType) updateData.deviceType = deviceType
    if (brand) updateData.brand = brand
    if (model) updateData.model = model
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber || null
    if (issue) updateData.issue = issue
    if (finalCost !== undefined) updateData.finalCost = finalCost ? parseFloat(finalCost) : null
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost ? parseFloat(estimatedCost) : null
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime || null
    if (notes !== undefined) updateData.notes = notes || null
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes || null
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Récupérer la réparation avant mise à jour pour comparer le statut
    const oldRepair = await companyPrisma.repair.findUnique({
      where: { id: params.id },
      select: { status: true },
    })

    const repair = await companyPrisma.repair.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
      },
    })

    // Envoyer une notification si le statut a changé
    if (status && oldRepair && status !== oldRepair.status) {
      try {
        // Récupérer le nom de l'entreprise depuis la base principale
        const { getMainPrisma } = await import('@/lib/db-manager')
        const mainPrisma = getMainPrisma()
        const session = await getServerSession(authOptions)
        if (session) {
          const user = await mainPrisma.user.findUnique({
            where: { id: (session.user as any).id },
            include: { company: true },
          })

          await sendRepairStatusNotification(companyPrisma, {
            customerName: `${repair.customer.firstName} ${repair.customer.lastName}`,
            customerEmail: repair.customer.email || undefined,
            customerPhone: repair.customer.phone,
            repairId: repair.id,
            ticketNumber: repair.ticketNumber,
            trackingToken: repair.trackingToken || undefined,
            deviceType: repair.deviceType,
            brand: repair.brand,
            model: repair.model,
            status: status,
            estimatedCost: repair.estimatedCost || undefined,
            finalCost: repair.finalCost || undefined,
            estimatedTime: repair.estimatedTime || undefined,
            notes: repair.notes || undefined,
            companyName: user?.company?.name,
          })
        }
      } catch (error) {
        // Ne pas faire échouer la requête si la notification échoue
        console.error('Erreur lors de l\'envoi de la notification:', error)
      }
    }

    return NextResponse.json({ repair })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

