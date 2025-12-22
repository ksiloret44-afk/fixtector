import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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
    const { password } = body

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await mainPrisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({ message: 'Mot de passe modifié avec succès' })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

