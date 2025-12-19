import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const repair = await prisma.repair.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ repair })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

