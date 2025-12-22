/**
 * Gestion de l'upload de fichiers
 */
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'repairs')

/**
 * Crée le dossier d'upload s'il n'existe pas
 */
export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Sauvegarde un fichier uploadé
 */
export async function saveUploadedFile(
  file: File,
  repairId: string
): Promise<{ filename: string; url: string }> {
  await ensureUploadDir()

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Générer un nom de fichier unique
  const timestamp = Date.now()
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `${repairId}-${timestamp}-${originalName}`
  const filepath = join(UPLOAD_DIR, filename)

  // Sauvegarder le fichier
  await writeFile(filepath, buffer)

  // Retourner l'URL relative
  const url = `/uploads/repairs/${filename}`

  return { filename, url }
}

/**
 * Valide le type de fichier (images uniquement)
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(file.type)
}

/**
 * Valide la taille du fichier (max 10MB)
 */
export function isValidFileSize(file: File): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return file.size <= maxSize
}

