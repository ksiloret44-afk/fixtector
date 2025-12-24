import { NextResponse } from 'next/server'
import { getMainPrisma } from '@/lib/db-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier que le mot de passe existe et n'est pas vide
    if (!user.password) {
      return NextResponse.json(
        { error: 'Aucun mot de passe défini pour ce compte' },
        { status: 400 }
      )
    }

    // Vérifier le mot de passe actuel
    let isPasswordValid = false
    try {
      // Nettoyer les espaces en début/fin
      const cleanedCurrentPassword = currentPassword.trim()
      const cleanedStoredPassword = user.password.trim()
      
      console.log('[DEBUG] Vérification du mot de passe pour user:', user.email)
      console.log('[DEBUG] Longueur mot de passe actuel:', cleanedCurrentPassword.length)
      console.log('[DEBUG] Longueur mot de passe stocké:', cleanedStoredPassword.length)
      console.log('[DEBUG] Hash stocké commence par:', cleanedStoredPassword.substring(0, 10))
      
      isPasswordValid = await bcrypt.compare(cleanedCurrentPassword, cleanedStoredPassword)
      console.log('[DEBUG] Résultat de la comparaison:', isPasswordValid)
    } catch (error) {
      console.error('Erreur lors de la comparaison du mot de passe:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du mot de passe' },
        { status: 500 }
      )
    }

    if (!isPasswordValid) {
      console.log('[DEBUG] Mot de passe actuel incorrect pour user:', user.email)
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    let hashedPassword: string
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10)
    } catch (error) {
      console.error('Erreur lors du hashage du mot de passe:', error)
      return NextResponse.json(
        { error: 'Erreur lors du hashage du mot de passe' },
        { status: 500 }
      )
    }

    // Mettre à jour le mot de passe
    try {
      const updatedUser = await mainPrisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })
      
      console.log('[DEBUG] Mot de passe mis à jour pour user:', updatedUser.email)
      console.log('[DEBUG] Nouveau hash commence par:', hashedPassword.substring(0, 10))
      
      // Vérifier que le mot de passe a bien été mis à jour
      const verifyUser = await mainPrisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })
      
      if (!verifyUser || verifyUser.password !== hashedPassword) {
        console.error('[ERROR] Le mot de passe n\'a pas été correctement mis à jour!')
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du mot de passe' },
          { status: 500 }
        )
      }
      
      // Vérifier que le nouveau mot de passe fonctionne
      const verifyNewPassword = await bcrypt.compare(newPassword, verifyUser.password)
      if (!verifyNewPassword) {
        console.error('[ERROR] Le nouveau mot de passe ne correspond pas au hash stocké!')
        return NextResponse.json(
          { error: 'Erreur lors de la vérification du nouveau mot de passe' },
          { status: 500 }
        )
      }
      
      console.log('[DEBUG] Vérification du nouveau mot de passe réussie')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Mot de passe modifié avec succès' })
  } catch (error) {
    console.error('Erreur lors de la modification:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

