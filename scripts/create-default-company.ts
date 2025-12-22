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
  console.log('🏢 Création d\'une entreprise par défaut pour les admins...\n')

  // Récupérer tous les utilisateurs admins
  const adminUsers = await mainPrisma.user.findMany({
    where: {
      role: 'admin',
      companyId: null,
    },
  })

  if (adminUsers.length === 0) {
    console.log('ℹ️  Aucun admin sans entreprise trouvé')
    return
  }

  // Créer une entreprise par défaut pour les admins
  let defaultCompany = await mainPrisma.company.findFirst({
    where: {
      name: { contains: 'Administration' },
    },
  })

  if (!defaultCompany) {
    defaultCompany = await mainPrisma.company.create({
      data: {
        name: 'Entreprise Administration',
        email: 'admin@fixtector.com',
      },
    })
    console.log(`✅ Entreprise créée: ${defaultCompany.name} (${defaultCompany.id})`)
  } else {
    console.log(`✅ Entreprise existante trouvée: ${defaultCompany.name} (${defaultCompany.id})`)
  }

  // Associer les admins à cette entreprise
  for (const admin of adminUsers) {
    await mainPrisma.user.update({
      where: { id: admin.id },
      data: { companyId: defaultCompany.id },
    })
    console.log(`   ✅ ${admin.email} associé à l'entreprise`)
  }

  // Initialiser la base de données de l'entreprise
  await initCompanyDatabase(defaultCompany.id)

  console.log('\n✅ Configuration terminée!')
  console.log(`\n📝 Les admins peuvent maintenant accéder à leur tableau de bord avec l'entreprise ${defaultCompany.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await mainPrisma.$disconnect()
  })

