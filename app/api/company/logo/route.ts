import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/company/logo
 * Upload le logo de l'entreprise
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Aucune entreprise associée' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés: JPEG, PNG, SVG, WebP' },
        { status: 400 }
      )
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Taille maximale: 5MB' },
        { status: 400 }
      )
    }

    // Créer le dossier logos s'il n'existe pas
    const logosDir = join(process.cwd(), 'public', 'logos')
    if (!existsSync(logosDir)) {
      await mkdir(logosDir, { recursive: true })
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `${user.company.id}-${Date.now()}.${fileExtension}`
    const filePath = join(logosDir, fileName)

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL relative du logo
    const logoUrl = `/logos/${fileName}`

    // Supprimer l'ancien logo s'il existe
    if (user.company.logoUrl) {
      const oldLogoPath = join(process.cwd(), 'public', user.company.logoUrl)
      if (existsSync(oldLogoPath)) {
        try {
          const { unlink } = await import('fs/promises')
          await unlink(oldLogoPath)
        } catch (err) {
          console.error('Erreur lors de la suppression de l\'ancien logo:', err)
        }
      }
    }

    // Mettre à jour la base de données
    const company = await mainPrisma.company.update({
      where: { id: user.company.id },
      data: { logoUrl },
    })

    return NextResponse.json({ 
      success: true, 
      logoUrl: company.logoUrl 
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload du logo:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'upload du logo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/company/logo
 * Supprime le logo de l'entreprise
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Aucune entreprise associée' },
        { status: 404 }
      )
    }

    // Supprimer le fichier logo
    if (user.company.logoUrl) {
      const logoPath = join(process.cwd(), 'public', user.company.logoUrl)
      if (existsSync(logoPath)) {
        try {
          const { unlink } = await import('fs/promises')
          await unlink(logoPath)
        } catch (err) {
          console.error('Erreur lors de la suppression du logo:', err)
        }
      }
    }

    // Mettre à jour la base de données
    await mainPrisma.company.update({
      where: { id: user.company.id },
      data: { logoUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du logo:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du logo' },
      { status: 500 }
    )
  }
}

