#!/usr/bin/env tsx
/**
 * Script de nettoyage de cache pour FixTector
 * Nettoie les caches Next.js, Prisma, npm, et autres fichiers temporaires
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function getDirSize(dirPath: string): number {
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
    // Ignorer les erreurs d'accès
  }
  return totalSize
}

function cleanNextJsCache() {
  log('\n[1/6] Nettoyage du cache Next.js...', 'cyan')
  const nextDir = path.join(process.cwd(), '.next')
  let freed = 0
  
  if (fs.existsSync(nextDir)) {
    const sizeBefore = getDirSize(nextDir)
    try {
      // Garder BUILD_ID mais nettoyer le reste
      const buildIdPath = path.join(nextDir, 'BUILD_ID')
      let buildId: string | null = null
      
      if (fs.existsSync(buildIdPath)) {
        buildId = fs.readFileSync(buildIdPath, 'utf-8').trim()
      }
      
      // Supprimer les sous-dossiers de cache
      const cacheDirs = ['cache', 'server', 'static']
      for (const dir of cacheDirs) {
        const dirPath = path.join(nextDir, dir)
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true })
        }
      }
      
      // Restaurer BUILD_ID si nécessaire
      if (buildId && !fs.existsSync(buildIdPath)) {
        fs.writeFileSync(buildIdPath, buildId)
      }
      
      const sizeAfter = getDirSize(nextDir)
      freed = sizeBefore - sizeAfter
      log(`  ✓ Cache Next.js nettoyé: ${formatBytes(freed)} libérés`, 'green')
    } catch (error: any) {
      log(`  ✗ Erreur: ${error.message}`, 'red')
    }
  } else {
    log('  ℹ Aucun cache Next.js trouvé', 'yellow')
  }
  
  return freed
}

function cleanPrismaCache() {
  log('\n[2/6] Nettoyage du cache Prisma...', 'cyan')
  let freed = 0
  
  try {
    // Nettoyer les clients Prisma générés
    const prismaClients = [
      path.join(process.cwd(), 'node_modules', '.prisma', 'client-main'),
      path.join(process.cwd(), 'node_modules', '.prisma', 'client-company'),
    ]
    
    for (const clientPath of prismaClients) {
      if (fs.existsSync(clientPath)) {
        const sizeBefore = getDirSize(clientPath)
        // Garder les fichiers essentiels mais nettoyer le cache
        const cacheDir = path.join(clientPath, 'cache')
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true })
        }
        const sizeAfter = getDirSize(clientPath)
        freed += sizeBefore - sizeAfter
      }
    }
    
    if (freed > 0) {
      log(`  ✓ Cache Prisma nettoyé: ${formatBytes(freed)} libérés`, 'green')
    } else {
      log('  ℹ Aucun cache Prisma à nettoyer', 'yellow')
    }
  } catch (error: any) {
    log(`  ✗ Erreur: ${error.message}`, 'red')
  }
  
  return freed
}

function cleanNodeModulesCache() {
  log('\n[3/6] Nettoyage du cache npm...', 'cyan')
  let freed = 0
  
  try {
    // Nettoyer le cache npm global
    const npmCacheDir = execSync('npm config get cache', { encoding: 'utf-8' }).trim()
    if (fs.existsSync(npmCacheDir)) {
      const sizeBefore = getDirSize(npmCacheDir)
      execSync('npm cache clean --force', { stdio: 'ignore' })
      const sizeAfter = getDirSize(npmCacheDir)
      freed = sizeBefore - sizeAfter
      log(`  ✓ Cache npm nettoyé: ${formatBytes(freed)} libérés`, 'green')
    } else {
      log('  ℹ Aucun cache npm trouvé', 'yellow')
    }
  } catch (error: any) {
    log(`  ✗ Erreur: ${error.message}`, 'red')
  }
  
  return freed
}

function cleanTempFiles() {
  log('\n[4/6] Nettoyage des fichiers temporaires...', 'cyan')
  let freed = 0
  
  const tempDirs = [
    path.join(process.cwd(), '.next', 'cache'),
    path.join(process.cwd(), 'tmp'),
    path.join(process.cwd(), 'temp'),
    path.join(process.cwd(), 'logs', '*.log'),
  ]
  
  for (const tempDir of tempDirs) {
    try {
      if (fs.existsSync(tempDir)) {
        const sizeBefore = getDirSize(tempDir)
        fs.rmSync(tempDir, { recursive: true, force: true })
        freed += sizeBefore
      }
    } catch (error: any) {
      // Ignorer les erreurs
    }
  }
  
  // Nettoyer les anciens logs (garder les 7 derniers jours)
  const logsDir = path.join(process.cwd(), 'logs')
  if (fs.existsSync(logsDir)) {
    try {
      const files = fs.readdirSync(logsDir)
      const now = Date.now()
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
      
      for (const file of files) {
        const filePath = path.join(logsDir, file)
        const stats = fs.statSync(filePath)
        if (stats.mtimeMs < sevenDaysAgo && file.endsWith('.log')) {
          const size = stats.size
          fs.unlinkSync(filePath)
          freed += size
        }
      }
    } catch (error: any) {
      // Ignorer les erreurs
    }
  }
  
  if (freed > 0) {
    log(`  ✓ Fichiers temporaires nettoyés: ${formatBytes(freed)} libérés`, 'green')
  } else {
    log('  ℹ Aucun fichier temporaire à nettoyer', 'yellow')
  }
  
  return freed
}

function cleanOldBuilds() {
  log('\n[5/6] Nettoyage des anciens builds...', 'cyan')
  let freed = 0
  
  try {
    // Garder seulement le dernier build
    const nextDir = path.join(process.cwd(), '.next')
    if (fs.existsSync(nextDir)) {
      const buildIdPath = path.join(nextDir, 'BUILD_ID')
      if (fs.existsSync(buildIdPath)) {
        const currentBuildId = fs.readFileSync(buildIdPath, 'utf-8').trim()
        
        // Nettoyer les anciens fichiers de build qui ne sont plus nécessaires
        const staticDir = path.join(nextDir, 'static')
        if (fs.existsSync(staticDir)) {
          // Garder seulement les fichiers récents (moins de 30 jours)
          const files = fs.readdirSync(staticDir, { recursive: true })
          const now = Date.now()
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
          
          for (const file of files) {
            const filePath = path.join(staticDir, file)
            try {
              const stats = fs.statSync(filePath)
              if (stats.mtimeMs < thirtyDaysAgo && stats.isFile()) {
                const size = stats.size
                fs.unlinkSync(filePath)
                freed += size
              }
            } catch (error) {
              // Ignorer les erreurs
            }
          }
        }
      }
    }
    
    if (freed > 0) {
      log(`  ✓ Anciens builds nettoyés: ${formatBytes(freed)} libérés`, 'green')
    } else {
      log('  ℹ Aucun ancien build à nettoyer', 'yellow')
    }
  } catch (error: any) {
    log(`  ✗ Erreur: ${error.message}`, 'red')
  }
  
  return freed
}

function optimizeDatabase() {
  log('\n[6/6] Optimisation des bases de données...', 'cyan')
  let freed = 0
  
  try {
    const prismaDir = path.join(process.cwd(), 'prisma')
    if (fs.existsSync(prismaDir)) {
      // VACUUM sur les bases SQLite pour récupérer l'espace
      const dbFiles = [
        path.join(prismaDir, 'main.db'),
        path.join(prismaDir, 'company.db'),
      ]
      
      // Chercher aussi dans le dossier companies
      const companiesDir = path.join(prismaDir, 'companies')
      if (fs.existsSync(companiesDir)) {
        const companyFiles = fs.readdirSync(companiesDir)
        for (const file of companyFiles) {
          if (file.endsWith('.db')) {
            dbFiles.push(path.join(companiesDir, file))
          }
        }
      }
      
      for (const dbFile of dbFiles) {
        if (fs.existsSync(dbFile)) {
          const sizeBefore = fs.statSync(dbFile).size
          try {
            // Utiliser sqlite3 pour VACUUM si disponible
            execSync(`sqlite3 "${dbFile}" VACUUM`, { stdio: 'ignore' })
            const sizeAfter = fs.statSync(dbFile).size
            freed += sizeBefore - sizeAfter
          } catch (error) {
            // sqlite3 non disponible, ignorer
          }
        }
      }
      
      if (freed > 0) {
        log(`  ✓ Bases de données optimisées: ${formatBytes(freed)} libérés`, 'green')
      } else {
        log('  ℹ Bases de données déjà optimisées', 'yellow')
      }
    }
  } catch (error: any) {
    log(`  ✗ Erreur: ${error.message}`, 'red')
  }
  
  return freed
}

function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose') || args.includes('-v')
  const force = args.includes('--force') || args.includes('-f')
  
  log('\n==========================================', 'blue')
  log('  Nettoyage de cache FixTector', 'blue')
  log('==========================================', 'blue')
  
  const startTime = Date.now()
  let totalFreed = 0
  
  totalFreed += cleanNextJsCache()
  totalFreed += cleanPrismaCache()
  totalFreed += cleanNodeModulesCache()
  totalFreed += cleanTempFiles()
  totalFreed += cleanOldBuilds()
  totalFreed += optimizeDatabase()
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  
  log('\n==========================================', 'blue')
  log(`  Nettoyage terminé !`, 'green')
  log(`  Espace libéré: ${formatBytes(totalFreed)}`, 'green')
  log(`  Durée: ${duration}s`, 'cyan')
  log('==========================================', 'blue')
  
  if (totalFreed > 0) {
    log('\n💡 Conseil: Redémarrez le serveur pour appliquer les changements', 'yellow')
  }
  
  return totalFreed
}

if (require.main === module) {
  main()
}

export { main as cleanCache }















