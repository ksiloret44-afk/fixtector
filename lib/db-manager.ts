// Imports Prisma - utiliser les chemins absolus pour compatibilité Windows/Linux
import { PrismaClient as MainPrismaClient } from '../../node_modules/.prisma/client-main'
import { PrismaClient as CompanyPrismaClient } from '../../node_modules/.prisma/client-company'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// Cache des connexions Prisma par entreprise
const companyPrismaClients: Map<string, CompanyPrismaClient> = new Map()
let mainPrismaClient: MainPrismaClient | null = null

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

  // Récupérer l'utilisateur depuis la base principale (toujours depuis la DB, pas depuis la session)
  // pour avoir le rôle à jour même si la session n'est pas rafraîchie
  const mainPrisma = getMainPrisma()
  const user = await mainPrisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { companyId: true, role: true, approved: true },
  })

  // Si l'utilisateur n'est pas approuvé, retourner null
  if (!user?.approved) {
    return null
  }

  // Si l'utilisateur a une entreprise, utiliser sa base de données
  // (même pour les admins, ils peuvent avoir leur propre base d'entreprise)
  if (user?.companyId) {
    // Initialiser la base de données si elle n'existe pas
    try {
      await initCompanyDatabase(user.companyId)
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error)
      // On continue quand même, la base sera créée à la première utilisation
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
export async function initCompanyDatabase(companyId: string): Promise<void> {
  const dbPath = getCompanyDbPath(companyId)
  const dbUrl = `file:${dbPath}`
  
  // Toujours synchroniser le schéma pour s'assurer que la base est à jour
  try {
    process.env.DATABASE_URL = dbUrl
    execSync(`npx prisma db push --schema=prisma/schema-company.prisma --accept-data-loss --skip-generate`, {
      cwd: process.cwd(),
      stdio: 'pipe',
    })
    if (!fs.existsSync(dbPath)) {
      console.log(`Base de données créée pour l'entreprise ${companyId}`)
    } else {
      console.log(`Base de données synchronisée pour l'entreprise ${companyId}`)
    }
  } catch (error) {
    console.error(`Erreur lors de l'initialisation de la base pour l'entreprise ${companyId}:`, error)
    // Ne pas faire échouer si la base existe déjà et a le bon schéma
    if (!fs.existsSync(dbPath)) {
      throw error
    }
  }
}

/**
 * Ferme toutes les connexions Prisma
 */
export async function disconnectAll(): Promise<void> {
  for (const [key, prisma] of companyPrismaClients.entries()) {
    await prisma.$disconnect()
  }
  companyPrismaClients.clear()
  
  if (mainPrismaClient) {
    await mainPrismaClient.$disconnect()
    mainPrismaClient = null
  }
}

