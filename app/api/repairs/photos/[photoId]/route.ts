import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'
import { unlink } from 'fs/promises'
import { join } from 'path'

/**
 * DELETE /api/repairs/photos/[photoId]
 * Supprime une photo
 */
export async function DELETE(
  request: Request,
  { params }: { params: { photoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return NextResponse.json(
        { error: 'Vous devez être associé à une entreprise' },
        { status: 403 }
      )
    }

    // Récupérer la photo
    const photo = await companyPrisma.repairPhoto.findUnique({
      where: { id: params.photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 })
    }

    // Supprimer le fichier
    try {
      const filepath = join(process.cwd(), 'public', photo.url)
      await unlink(filepath)
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error)
      // Continuer même si le fichier n'existe pas
    }

    // Supprimer de la base de données
    await companyPrisma.repairPhoto.delete({
      where: { id: params.photoId },
    })

    return NextResponse.json({ message: 'Photo supprimée avec succès' })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

