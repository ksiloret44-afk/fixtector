import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { name, email } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà (si on le modifie)
    if (email) {
      const existingUser = await mainPrisma.user.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    const user = await mainPrisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        suspended: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ 
      message: 'Informations mises à jour avec succès',
      user 
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    
    let errorMessage = 'Une erreur est survenue'
    if (error.code === 'P2002') {
      errorMessage = 'Cet email est déjà utilisé'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

