// Imports Prisma - utiliser les alias webpack définis dans next.config.js
import { PrismaClient as MainPrismaClient } from '.prisma/client-main'
import { PrismaClient as CompanyPrismaClient } from '.prisma/client-company'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// Cache des connexions Prisma par entreprise
const companyPrismaClients: Map<string, CompanyPrismaClient> = new Map()
let mainPrismaClient: MainPrismaClient | null = null

// Cache des informations utilisateur (évite les requêtes répétées dans la même requête)
// Cache avec TTL de 1 seconde pour éviter les requêtes multiples dans la même requête HTTP
interface UserCacheEntry {
  userId: string
  companyId: string | null
  role: string
  approved: boolean
  timestamp: number
}

const userCache = new Map<string, UserCacheEntry>()
const CACHE_TTL = 1000 // 1 seconde - juste pour éviter les requêtes multiples dans la même requête

// Base de données principale pour les utilisateurs et entreprises
// Utiliser DATABASE_URL_MAIN depuis .env.local si disponible, sinon construire le chemin
const MAIN_DB_PATH = process.env.DATABASE_URL_MAIN 
  ? process.env.DATABASE_URL_MAIN.replace(/^file:/, '')
  : path.join(process.cwd(), 'prisma', 'main.db')
const COMPANIES_DB_DIR = path.join(process.cwd(), 'prisma', 'companies')

/**
 * Obtient le chemin de la base de données pour une entreprise
 */
export function getCompanyDbPath(companyId: string): string {
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(COMPANIES_DB_DIR)) {
    fs.mkdirSync(COMPANIES_DB_DIR, { recursive: true })
  }
  
  return path.join(COMPANIES_DB_DIR, `${companyId}.db`)
}

/**
 * Obtient ou crée une connexion Prisma pour une entreprise
 */
export function getCompanyPrisma(companyId: string): CompanyPrismaClient {
  // Vérifier si on a déjà une connexion pour cette entreprise
  if (companyPrismaClients.has(companyId)) {
    return companyPrismaClients.get(companyId)!
  }

  const dbPath = getCompanyDbPath(companyId)
  const dbUrl = `file:${dbPath}`

  // Créer une nouvelle connexion Prisma avec la base de données de l'entreprise
  const prisma = new CompanyPrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })

  // Mettre en cache la connexion
  companyPrismaClients.set(companyId, prisma)

  return prisma
}

/**
 * Obtient la connexion Prisma principale (pour les utilisateurs et entreprises)
 */
export function getMainPrisma(): MainPrismaClient {
  if (mainPrismaClient) {
    return mainPrismaClient
  }

  // Utiliser DATABASE_URL_MAIN depuis .env.local si disponible
  const dbUrl = process.env.DATABASE_URL_MAIN || `file:${path.join(process.cwd(), 'prisma', 'main.db')}`
  mainPrismaClient = new MainPrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })

  return mainPrismaClient
}

/**
 * Obtient la connexion Prisma pour l'utilisateur connecté
 * - Admin : peut accéder à sa propre base de données d'entreprise (s'il en a une)
 * - User : retourne la base de données de son entreprise (crée la base si nécessaire)
 * 
 * Note: Les admins peuvent aussi utiliser getMainPrisma() pour gérer toutes les entreprises
 */
export async function getUserPrisma(): Promise<CompanyPrismaClient | null> {
  const session = await getServerSession(authOptions)
  
  if (!session || !(session.user as any).id) {
    return null
  }

  const userId = (session.user as any).id
  const now = Date.now()
  
  // Vérifier le cache (évite les requêtes multiples dans la même requête HTTP)
  const cached = userCache.get(userId)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    // Utiliser les données en cache
    if (!cached.approved) {
      return null
    }
    if (cached.companyId) {
      return getCompanyPrisma(cached.companyId)
    }
    // Continuer pour créer l'entreprise si nécessaire
  }

  // Récupérer l'utilisateur depuis la base principale (toujours depuis la DB, pas depuis la session)
  // pour avoir le rôle à jour même si la session n'est pas rafraîchie
  const mainPrisma = getMainPrisma()
  const user = await mainPrisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, role: true, approved: true },
  })
  
  // Mettre en cache
  if (user) {
    userCache.set(userId, {
      userId,
      companyId: user.companyId,
      role: user.role,
      approved: user.approved,
      timestamp: now,
    })
  }

  // Si l'utilisateur n'est pas approuvé, retourner null
  if (!user?.approved) {
    return null
  }

  // Si l'utilisateur a une entreprise, utiliser sa base de données
  // (même pour les admins, ils peuvent avoir leur propre base d'entreprise)
  if (user?.companyId) {
    // Initialiser la base de données seulement si elle n'existe pas
    // (optimisation : ne pas synchroniser à chaque appel)
    const dbPath = getCompanyDbPath(user.companyId)
    if (!fs.existsSync(dbPath)) {
      try {
        await initCompanyDatabase(user.companyId)
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error)
        // On continue quand même, la base sera créée à la première utilisation
      }
    }
    return getCompanyPrisma(user.companyId)
  }

  // Si l'utilisateur n'a pas d'entreprise mais est approuvé, créer une entreprise
  if (user?.approved && !user?.companyId) {
    try {
      const company = await mainPrisma.company.create({
        data: {
          name: `Entreprise - ${(session.user as any).name || 'Utilisateur'}`,
          email: (session.user as any).email,
        },
      })

      await mainPrisma.user.update({
        where: { id: (session.user as any).id },
        data: { companyId: company.id },
      })

      await initCompanyDatabase(company.id)
      return getCompanyPrisma(company.id)
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise:', error)
      return null
    }
  }

  return null
}

/**
 * Obtient la connexion Prisma pour une entreprise spécifique (pour les admins)
 */
export function getCompanyPrismaById(companyId: string): CompanyPrismaClient {
  return getCompanyPrisma(companyId)
}

/**
 * Vérifie si l'utilisateur connecté est admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  
  if (!session || !(session.user as any).id) {
    return false
  }

  const mainPrisma = getMainPrisma()
  const user = await mainPrisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { role: true },
  })

  return user?.role === 'admin'
}

/**
 * Initialise la base de données d'une entreprise (crée le schéma si nécessaire)
 */
// Cache pour éviter de synchroniser plusieurs fois la même base dans la même session
const syncedDatabases = new Set<string>()

export async function initCompanyDatabase(companyId: string): Promise<void> {
  const dbPath = getCompanyDbPath(companyId)
  const dbUrl = `file:${dbPath}`
  
  // Si la base existe déjà et a été synchronisée dans cette session, ne pas re-synchroniser
  if (fs.existsSync(dbPath) && syncedDatabases.has(companyId)) {
    return
  }
  
  // Synchroniser le schéma seulement si nécessaire
  try {
    process.env.DATABASE_URL = dbUrl
    
    // Si la base n'existe pas, la créer
    if (!fs.existsSync(dbPath)) {
      execSync(`npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      })
      console.log(`Base de données créée pour l'entreprise ${companyId}`)
      syncedDatabases.add(companyId)
    } else {
      // La base existe, marquer comme synchronisée sans re-synchroniser
      // (on suppose que le schéma est déjà à jour)
      syncedDatabases.add(companyId)
    }
  } catch (error) {
    console.error(`Erreur lors de l'initialisation de la base pour l'entreprise ${companyId}:`, error)
    // Ne pas faire échouer si la base existe déjà et a le bon schéma
    if (!fs.existsSync(dbPath)) {
      throw error
    }
    // Marquer comme synchronisée même en cas d'erreur si la base existe
    syncedDatabases.add(companyId)
  }
}

/**
 * Ferme toutes les connexions Prisma
 */
export async function disconnectAll(): Promise<void> {
  const entries = Array.from(companyPrismaClients.entries())
  for (const [key, prisma] of entries) {
    await prisma.$disconnect()
  }
  companyPrismaClients.clear()
  
  if (mainPrismaClient) {
    await mainPrismaClient.$disconnect()
    mainPrismaClient = null
  }
}

