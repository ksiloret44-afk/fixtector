import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import bcrypt from 'bcryptjs'

// GET: Vérifier si le token est valide
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Chercher le token
    const resetToken = await mainPrisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      )
    }

    // Vérifier si le token a été utilisé
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Ce lien a déjà été utilisé' },
        { status: 400 }
      )
    }

    // Vérifier si le token a expiré
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Ce lien a expiré' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe et est approuvé
    if (!resetToken.user || !resetToken.user.approved || resetToken.user.suspended) {
      return NextResponse.json(
        { error: 'Compte invalide' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.user.email,
    })
  } catch (error: any) {
    console.error('Erreur lors de la validation du token:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// POST: Réinitialiser le mot de passe
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Chercher le token
    const resetToken = await mainPrisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      )
    }

    // Vérifier si le token a été utilisé
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Ce lien a déjà été utilisé' },
        { status: 400 }
      )
    }

    // Vérifier si le token a expiré
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Ce lien a expiré. Veuillez demander un nouveau lien.' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe et est approuvé
    if (!resetToken.user || !resetToken.user.approved || resetToken.user.suspended) {
      return NextResponse.json(
        { error: 'Compte invalide' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe et marquer le token comme utilisé
    await mainPrisma.$transaction([
      mainPrisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      mainPrisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    console.log(`Mot de passe réinitialisé pour l'utilisateur: ${resetToken.user.email}`)

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}














