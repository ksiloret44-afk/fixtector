import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()
    const userId = (session.user as any).id

    // Vérifier que l'utilisateur existe et que c'est bien lui
    const user = await mainPrisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== user.email) {
      const existingUser = await mainPrisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour l'utilisateur
    await mainPrisma.user.update({
      where: { id: userId },
      data: {
        email,
        password: hashedPassword,
        mustChangePassword: false, // Plus besoin de changer le mot de passe
      },
    })

    return NextResponse.json({
      message: 'Email et mot de passe mis à jour avec succès',
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    )
  }
}

