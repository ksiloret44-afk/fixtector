import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const body = await request.json()
    const { suspended } = body

    // Ne pas permettre de suspendre son propre compte
    if (params.id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas suspendre votre propre compte' },
        { status: 400 }
      )
    }

    const user = await mainPrisma.user.update({
      where: { id: params.id },
      data: {
        suspended: suspended === true || suspended === 'true',
        suspendedAt: suspended === true || suspended === 'true' ? new Date() : null,
        suspendedBy: suspended === true || suspended === 'true' ? (session.user as any).id : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        suspended: true,
      },
    })

    return NextResponse.json({ 
      message: user.suspended ? 'Compte suspendu avec succès' : 'Compte réactivé avec succès',
      user 
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

