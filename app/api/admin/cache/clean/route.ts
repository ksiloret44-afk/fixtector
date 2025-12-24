import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMainPrisma } from '@/lib/db-manager'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const mainPrisma = await getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { email: session.user?.email || '' },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json()
    const { type } = body // 'all', 'nextjs', 'prisma', 'npm', 'temp', 'builds', 'db'

    let freed = 0
    const results: Record<string, number> = {}

    // Fonction pour calculer la taille d'un répertoire
    const getDirSize = (dirPath: string): number => {
      let totalSize = 0
      try {
        if (!fs.existsSync(dirPath)) return 0
        const files = fs.readdirSync(dirPath)
        for (const file of files) {
          const filePath = path.join(dirPath, file)
          const stats = fs.statSync(filePath)
          if (stats.isDirectory()) {
            totalSize += getDirSize(filePath)
          } else {
            totalSize += stats.size
          }
        }
      } catch (error) {
        // Ignorer les erreurs
      }
      return totalSize
    }

    // 1. Nettoyage du cache Next.js
    if (type === 'all' || type === 'nextjs') {
      const nextDir = path.join(process.cwd(), '.next')
      if (fs.existsSync(nextDir)) {
        const sizeBefore = getDirSize(nextDir)
        const buildIdPath = path.join(nextDir, 'BUILD_ID')
        let buildId: string | null = null

        if (fs.existsSync(buildIdPath)) {
          buildId = fs.readFileSync(buildIdPath, 'utf-8').trim()
        }

        const cacheDirs = ['cache', 'server', 'static']
        for (const dir of cacheDirs) {
          const dirPath = path.join(nextDir, dir)
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true })
          }
        }

        if (buildId && !fs.existsSync(buildIdPath)) {
          fs.writeFileSync(buildIdPath, buildId)
        }

        const sizeAfter = getDirSize(nextDir)
        freed = sizeBefore - sizeAfter
        results.nextjs = freed
      }
    }

    // 2. Nettoyage du cache Prisma
    if (type === 'all' || type === 'prisma') {
      const prismaClients = [
        path.join(process.cwd(), 'node_modules', '.prisma', 'client-main'),
        path.join(process.cwd(), 'node_modules', '.prisma', 'client-company'),
      ]

      let prismaFreed = 0
      for (const clientPath of prismaClients) {
        if (fs.existsSync(clientPath)) {
          const sizeBefore = getDirSize(clientPath)
          const cacheDir = path.join(clientPath, 'cache')
          if (fs.existsSync(cacheDir)) {
            fs.rmSync(cacheDir, { recursive: true, force: true })
          }
          const sizeAfter = getDirSize(clientPath)
          prismaFreed += sizeBefore - sizeAfter
        }
      }
      results.prisma = prismaFreed
      freed += prismaFreed
    }

    // 3. Nettoyage du cache npm
    if (type === 'all' || type === 'npm') {
      try {
        const npmCacheDir = execSync('npm config get cache', { encoding: 'utf-8' }).trim()
        if (fs.existsSync(npmCacheDir)) {
          const sizeBefore = getDirSize(npmCacheDir)
          execSync('npm cache clean --force', { stdio: 'ignore' })
          const sizeAfter = getDirSize(npmCacheDir)
          const npmFreed = sizeBefore - sizeAfter
          results.npm = npmFreed
          freed += npmFreed
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    // 4. Nettoyage des fichiers temporaires
    if (type === 'all' || type === 'temp') {
      let tempFreed = 0
      const tempDirs = [
        path.join(process.cwd(), '.next', 'cache'),
        path.join(process.cwd(), 'tmp'),
        path.join(process.cwd(), 'temp'),
      ]

      for (const tempDir of tempDirs) {
        if (fs.existsSync(tempDir)) {
          const sizeBefore = getDirSize(tempDir)
          fs.rmSync(tempDir, { recursive: true, force: true })
          tempFreed += sizeBefore
        }
      }

      // Nettoyer les anciens logs (plus de 7 jours)
      const logsDir = path.join(process.cwd(), 'logs')
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir)
        const now = Date.now()
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

        for (const file of files) {
          const filePath = path.join(logsDir, file)
          const stats = fs.statSync(filePath)
          if (stats.mtimeMs < sevenDaysAgo && file.endsWith('.log')) {
            tempFreed += stats.size
            fs.unlinkSync(filePath)
          }
        }
      }

      results.temp = tempFreed
      freed += tempFreed
    }

    // 5. Nettoyage des anciens builds
    if (type === 'all' || type === 'builds') {
      let buildsFreed = 0
      const staticDir = path.join(process.cwd(), '.next', 'static')
      if (fs.existsSync(staticDir)) {
        const files = fs.readdirSync(staticDir, { recursive: true })
        const now = Date.now()
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

        for (const file of files) {
          const filePath = path.join(staticDir, String(file))
          try {
            const stats = fs.statSync(filePath)
            if (stats.mtimeMs < thirtyDaysAgo && stats.isFile()) {
              buildsFreed += stats.size
              fs.unlinkSync(filePath)
            }
          } catch (error) {
            // Ignorer les erreurs
          }
        }
      }
      results.builds = buildsFreed
      freed += buildsFreed
    }

    // 6. Optimisation des bases de données
    if (type === 'all' || type === 'db') {
      // Note: VACUUM nécessite sqlite3, on l'ignore si non disponible
      results.db = 0
    }

    return NextResponse.json({
      success: true,
      message: 'Cache nettoyé avec succès',
      freed: freed,
      details: results,
    })
  } catch (error: any) {
    console.error('Erreur lors du nettoyage du cache:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du nettoyage du cache',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}


