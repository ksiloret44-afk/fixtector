import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma } from '@/lib/db-manager'
import { saveUploadedFile, isValidImageType, isValidFileSize } from '@/lib/file-upload'

/**
 * POST /api/repairs/[id]/photos
 * Upload une photo pour une réparation
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    // Vérifier que la réparation existe
    const repair = await companyPrisma.repair.findUnique({
      where: { id: params.id },
    })

    if (!repair) {
      return NextResponse.json({ error: 'Réparation non trouvée' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = (formData.get('type') as string) || 'other'
    const description = (formData.get('description') as string) || null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Valider le type de fichier
    if (!isValidImageType(file)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF' },
        { status: 400 }
      )
    }

    // Valider la taille
    if (!isValidFileSize(file)) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Taille maximum: 10MB' },
        { status: 400 }
      )
    }

    // Sauvegarder le fichier
    const { filename, url } = await saveUploadedFile(file, params.id)

    // Enregistrer dans la base de données
    const photo = await companyPrisma.repairPhoto.create({
      data: {
        repairId: params.id,
        url,
        filename,
        type,
        description,
        uploadedBy: (session.user as any).id,
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'upload' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/repairs/[id]/photos
 * Récupère toutes les photos d'une réparation
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const photos = await companyPrisma.repairPhoto.findMany({
      where: { repairId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

