import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/auth/backup-codes/generate
 * Génère 5 nouveaux codes de secours pour l'utilisateur connecté
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const mainPrisma = getMainPrisma()
    const userId = (session.user as any).id

    // Supprimer les anciens codes de secours (utilisés ou non)
    await mainPrisma.twoFactorBackupCode.deleteMany({
      where: { userId },
    })

    // Générer 5 codes de secours uniques
    const codes: string[] = []
    const codeHashes: { codeHash: string }[] = []

    for (let i = 0; i < 5; i++) {
      // Générer un code aléatoire de 8 caractères (lettres et chiffres)
      const code = randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
      
      // Hasher le code
      const codeHash = await bcrypt.hash(code, 10)
      codeHashes.push({ codeHash })
    }

    // Stocker les codes hashés dans la base de données
    await mainPrisma.twoFactorBackupCode.createMany({
      data: codeHashes.map(({ codeHash }) => ({
        userId,
        codeHash,
      })),
    })

    // Retourner les codes en clair (une seule fois)
    return NextResponse.json({
      success: true,
      codes,
      message: 'Codes de secours générés. Sauvegardez-les dans un endroit sûr.',
    })
  } catch (error: any) {
    console.error('Erreur lors de la génération des codes de secours:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération des codes de secours' },
      { status: 500 }
    )
  }
}


