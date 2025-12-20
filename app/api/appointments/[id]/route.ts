import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { customerId, repairId, title, description, startDate, endDate, status } = body

    const updateData: any = {}
    if (customerId) updateData.customerId = customerId
    if (repairId !== undefined) updateData.repairId = repairId || null
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description || null
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (status) updateData.status = status

    const appointment = await companyPrisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        repair: {
          select: {
            id: true,
            ticketNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    await companyPrisma.appointment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Rendez-vous supprimé avec succès' })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

