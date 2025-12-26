import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Ces champs n'existent plus dans le schéma, retourner des valeurs par défaut
    return NextResponse.json({
      hideUpdateModal: false,
      lastSeenUpdateVersion: null,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la préférence:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Ces champs n'existent plus dans le schéma, retourner un succès
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la préférence:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



