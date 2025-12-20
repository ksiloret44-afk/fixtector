import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { email },
      select: {
        approved: true,
        suspended: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      approved: user.approved,
      suspended: user.suspended,
      email: user.email,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

