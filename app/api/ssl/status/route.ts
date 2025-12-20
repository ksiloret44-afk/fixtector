import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier si on est en HTTPS
    const isHttps = process.env.NEXTAUTH_URL?.startsWith('https://') || false
    
    // Vérifier si un certificat SSL existe (via les variables d'environnement ou la configuration)
    // Pour une vérification plus précise, on pourrait vérifier les fichiers de certificat
    // mais pour l'instant, on se base sur l'URL et les variables d'environnement
    
    return NextResponse.json({
      sslActive: isHttps,
      httpsUrl: process.env.NEXTAUTH_URL,
      message: isHttps ? 'SSL actif' : 'SSL non configuré',
    })
  } catch (error) {
    console.error('Erreur lors de la vérification SSL:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue', sslActive: false },
      { status: 500 }
    )
  }
}

