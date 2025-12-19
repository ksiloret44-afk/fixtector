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
    const { status, finalCost, internalNotes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (finalCost !== undefined) updateData.finalCost = parseFloat(finalCost)
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
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

