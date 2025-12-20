import { PrismaClient as MainPrismaClient } from '../node_modules/.prisma/client-main'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Charger les variables d'environnement depuis .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
} catch (error) {
  console.error('Erreur lors du chargement de .env.local:', error)
}

const mainPrisma = new MainPrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_MAIN || 'file:./prisma/main.db',
    },
  },
})

const COMPANIES_DB_DIR = path.join(process.cwd(), 'prisma', 'companies')

function getCompanyDbPath(companyId: string): string {
  if (!fs.existsSync(COMPANIES_DB_DIR)) {
    fs.mkdirSync(COMPANIES_DB_DIR, { recursive: true })
  }
  return path.join(COMPANIES_DB_DIR, `${companyId}.db`)
}

async function initCompanyDatabase(companyId: string): Promise<void> {
  const dbPath = getCompanyDbPath(companyId)
  
  if (!fs.existsSync(dbPath)) {
    const dbUrl = `file:${dbPath}`
    try {
      process.env.DATABASE_URL = dbUrl
      execSync(`npx prisma db push --schema=prisma/schema-company.prisma`, {
        cwd: process.cwd(),
        stdio: 'inherit',
      })
      console.log(`✅ Base de données créée pour l'entreprise ${companyId}`)
    } catch (error) {
      console.error(`❌ Erreur lors de l'initialisation de la base pour l'entreprise ${companyId}:`, error)
      throw error
    }
  }
}

async function main() {
  console.log('🔧 Correction des utilisateurs existants...\n')

  // Récupérer tous les utilisateurs approuvés sans entreprise
  const usersWithoutCompany = await mainPrisma.user.findMany({
    where: {
      approved: true,
      companyId: null,
      role: { not: 'admin' }, // Les admins n'ont pas besoin d'entreprise
    },
  })

  console.log(`📊 ${usersWithoutCompany.length} utilisateur(s) sans entreprise trouvé(s)\n`)

  for (const user of usersWithoutCompany) {
    try {
      // Créer une entreprise pour cet utilisateur
      const company = await mainPrisma.company.create({
        data: {
          name: `${user.name} - Entreprise`,
          email: user.email,
        },
      })

      // Associer l'utilisateur à l'entreprise
      await mainPrisma.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      })

      // Initialiser la base de données de l'entreprise
      await initCompanyDatabase(company.id)

      console.log(`✅ Utilisateur ${user.email} associé à l'entreprise ${company.id}`)
    } catch (error: any) {
      console.error(`❌ Erreur pour l'utilisateur ${user.email}:`, error.message)
    }
  }

  // Vérifier les entreprises existantes et initialiser leurs bases
  const companies = await mainPrisma.company.findMany()
  console.log(`\n📊 ${companies.length} entreprise(s) trouvée(s)\n`)

  for (const company of companies) {
    try {
      await initCompanyDatabase(company.id)
      console.log(`✅ Base de données vérifiée pour l'entreprise ${company.name}`)
    } catch (error: any) {
      console.error(`❌ Erreur pour l'entreprise ${company.name}:`, error.message)
    }
  }

  console.log('\n✅ Correction terminée!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await mainPrisma.$disconnect()
  })

