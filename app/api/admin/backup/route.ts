import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
const archiver = require('archiver')

const ABSOLUTE_ADMIN_EMAIL = 'rpphone@ik.me'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/backup
 * Crée une sauvegarde complète de toutes les bases de données
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== 'admin' || user.email !== ABSOLUTE_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Seul l\'administrateur absolu peut effectuer cette action' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      )
    }

    // Vérifier le mot de passe de l'admin absolu
    const mainPrisma = getMainPrisma()
    const adminUser = await mainPrisma.user.findUnique({
      where: { email: ABSOLUTE_ADMIN_EMAIL },
      select: { password: true },
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Administrateur absolu non trouvé' },
        { status: 404 }
      )
    }

    const bcrypt = require('bcryptjs')
    const isValidPassword = await bcrypt.compare(password, adminUser.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Créer le dossier de sauvegarde
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `backup-${timestamp}.zip`
    const backupPath = path.join(backupDir, backupFileName)

    // Créer l'archive ZIP
    const output = fs.createWriteStream(backupPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise<NextResponse>((resolve, reject) => {
      archive.on('error', (err: Error) => {
        console.error('Erreur lors de la création de l\'archive:', err)
        reject(NextResponse.json({ error: 'Erreur lors de la création de la sauvegarde' }, { status: 500 }))
      })

      output.on('close', () => {
        // Lire le fichier et le renvoyer
        const fileBuffer = fs.readFileSync(backupPath)
        
        // Supprimer le fichier temporaire après lecture
        fs.unlinkSync(backupPath)

        resolve(
          new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${backupFileName}"`,
            },
          })
        )
      })

      archive.pipe(output)

      // Ajouter la base de données principale
      const mainDbPath = process.env.DATABASE_URL_MAIN 
        ? process.env.DATABASE_URL_MAIN.replace(/^file:/, '')
        : path.join(process.cwd(), 'prisma', 'main.db')
      
      if (fs.existsSync(mainDbPath)) {
        archive.file(mainDbPath, { name: 'main.db' })
      }

      // Ajouter toutes les bases de données d'entreprise
      const companiesDir = path.join(process.cwd(), 'prisma', 'companies')
      if (fs.existsSync(companiesDir)) {
        const companyFiles = fs.readdirSync(companiesDir).filter(file => file.endsWith('.db'))
        companyFiles.forEach(file => {
          archive.file(path.join(companiesDir, file), { name: `companies/${file}` })
        })
      }

      archive.finalize()
    })
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de la sauvegarde' },
      { status: 500 }
    )
  }
}

