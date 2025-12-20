import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * API pour réinitialiser le paramètre "Ne plus apparaître"
 * Utile si l'utilisateur veut revoir les nouveautés
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Cette route ne fait rien côté serveur car le localStorage est géré côté client
    // Mais on peut l'utiliser pour logger ou pour des statistiques
    return NextResponse.json({ 
      success: true,
      message: 'Le paramètre sera réinitialisé côté client lors de la prochaine mise à jour majeure'
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

