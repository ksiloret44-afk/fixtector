import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import bcrypt from 'bcryptjs'

// Import du stockage des codes 2FA depuis send-2fa
// En production, on devrait utiliser une base de données ou Redis
// Pour l'instant, on utilise un Map partagé
declare global {
  var twoFactorCodes: Map<string, { code: string; expiresAt: Date; userId: string }> | undefined
}

// Utiliser une variable globale pour partager le Map entre les routes
if (!global.twoFactorCodes) {
  global.twoFactorCodes = new Map()
}
const twoFactorCodes = global.twoFactorCodes

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/auth/verify-2fa
 * Vérifie le code 2FA et retourne les informations utilisateur pour la connexion
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

    // Récupérer le code stocké
    const codeData = twoFactorCodes.get(email)
    if (!codeData) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Vérifier l'expiration
    const now = new Date()
    if (codeData.expiresAt < now) {
      twoFactorCodes.delete(email)
      return NextResponse.json(
        { error: 'Code expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Vérifier le code
    if (codeData.code !== code) {
      return NextResponse.json(
        { error: 'Code incorrect' },
        { status: 400 }
      )
    }

    // Code valide, récupérer les informations utilisateur
    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: codeData.userId },
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
      twoFactorCodes.delete(email)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est toujours approuvé et non suspendu
    if (!user.approved) {
      twoFactorCodes.delete(email)
      return NextResponse.json(
        { error: 'Compte en attente d\'approbation' },
        { status: 403 }
      )
    }

    if (user.suspended) {
      twoFactorCodes.delete(email)
      return NextResponse.json(
        { error: 'COMPTE_SUSPENDU' },
        { status: 403 }
      )
    }

    // Supprimer le code utilisé
    twoFactorCodes.delete(email)

    // Retourner les informations utilisateur (sans le mot de passe)
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
    console.error('Erreur lors de la vérification du code 2FA:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}


