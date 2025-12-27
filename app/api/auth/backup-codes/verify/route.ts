import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/auth/backup-codes/verify
 * Vérifie un code de secours et retourne les informations utilisateur
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 }
      )
    }

    const mainPrisma = getMainPrisma()

    // Récupérer l'utilisateur
    const user = await mainPrisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        theme: true,
        approved: true,
        suspended: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est approuvé
    if (!user.approved) {
      return NextResponse.json(
        { error: 'Compte en attente d\'approbation' },
        { status: 403 }
      )
    }

    // Vérifier si le compte est suspendu
    if (user.suspended) {
      return NextResponse.json(
        { error: 'COMPTE_SUSPENDU' },
        { status: 403 }
      )
    }

    // Récupérer tous les codes de secours non utilisés de l'utilisateur
    const backupCodes = await mainPrisma.twoFactorBackupCode.findMany({
      where: {
        userId: user.id,
        used: false,
      },
    })

    // Vérifier le code contre tous les codes de secours
    let validCode = null
    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code.toUpperCase(), backupCode.codeHash)
      if (isValid) {
        validCode = backupCode
        break
      }
    }

    if (!validCode) {
      return NextResponse.json(
        { error: 'Code de secours invalide ou déjà utilisé' },
        { status: 400 }
      )
    }

    // Marquer le code comme utilisé
    await mainPrisma.twoFactorBackupCode.update({
      where: { id: validCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    })

    // Retourner les informations utilisateur
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        theme: user.theme || 'light',
      },
    })
  } catch (error: any) {
    console.error('Erreur lors de la vérification du code de secours:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}


