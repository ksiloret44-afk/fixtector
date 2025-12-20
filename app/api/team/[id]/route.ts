import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

/**
 * PATCH /api/team/[id]
 * Met à jour un collaborateur
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, role, password } = body

    const mainPrisma = getMainPrisma()
    
    // Vérifier que l'utilisateur actuel appartient à la même entreprise
    const currentUser = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true, role: true },
    })

    const targetUser = await mainPrisma.user.findUnique({
      where: { id: params.id },
      select: { companyId: true, role: true },
    })

    if (!targetUser || targetUser.companyId !== currentUser?.companyId) {
      return NextResponse.json(
        { error: 'Collaborateur non trouvé ou n\'appartient pas à votre entreprise' },
        { status: 404 }
      )
    }

    // Empêcher qu'un utilisateur normal modifie un administrateur
    if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions pour modifier un administrateur' },
        { status: 403 }
      )
    }

    // Seuls les admins peuvent créer/modifier des admins
    if (role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer ou modifier des administrateurs' },
        { status: 403 }
      )
    }

    // Ne pas permettre de changer le rôle en "admin" si l'utilisateur actuel n'est pas admin
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) {
      // Seuls les admins peuvent changer le rôle en admin
      if (role === 'admin' && currentUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Seuls les administrateurs peuvent attribuer le rôle administrateur' },
          { status: 403 }
        )
      }
      updateData.role = role
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await mainPrisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Erreur:', error)
    
    let errorMessage = 'Une erreur est survenue'
    if (error.code === 'P2002') {
      errorMessage = 'Cet email est déjà utilisé'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team/[id]
 * Supprime un collaborateur
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    
    // Ne pas permettre de supprimer son propre compte
    if (params.id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur actuel appartient à la même entreprise
    const currentUser = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true, role: true },
    })

    const targetUser = await mainPrisma.user.findUnique({
      where: { id: params.id },
      select: { companyId: true, role: true },
    })

    if (!targetUser || targetUser.companyId !== currentUser?.companyId) {
      return NextResponse.json(
        { error: 'Collaborateur non trouvé ou n\'appartient pas à votre entreprise' },
        { status: 404 }
      )
    }

    // Empêcher qu'un utilisateur normal supprime un administrateur
    if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les permissions pour supprimer un administrateur' },
        { status: 403 }
      )
    }

    await mainPrisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Collaborateur supprimé avec succès' })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

