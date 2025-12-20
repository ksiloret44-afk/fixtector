import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
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

    const appointments = await companyPrisma.appointment.findMany({
      include: {
        customer: true,
        repair: {
          select: {
            id: true,
            ticketNumber: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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
    const { customerId, repairId, title, description, startDate, endDate } = body

    if (!customerId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Les champs client, titre, date de début et date de fin sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le client existe
    const customer = await companyPrisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que la réparation existe si fournie
    if (repairId) {
      const repair = await companyPrisma.repair.findUnique({
        where: { id: repairId },
      })

      if (!repair) {
        return NextResponse.json(
          { error: 'Réparation non trouvée' },
          { status: 404 }
        )
      }
    }

    const appointment = await companyPrisma.appointment.create({
      data: {
        customerId,
        repairId: repairId || null,
        userId: (session.user as any).id,
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'scheduled',
      },
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

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

