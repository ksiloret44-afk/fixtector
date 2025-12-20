import { PrismaClient as OldPrismaClient } from '@prisma/client'
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

// Ancienne base (test.db)
const oldPrisma = new OldPrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/test.db',
    },
  },
})

// Nouvelle base principale
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
  console.log('🔄 Migration des utilisateurs de l\'ancienne base vers la nouvelle...\n')

  try {
    // Récupérer tous les utilisateurs de l'ancienne base
    const oldUsers = await oldPrisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        approved: true,
        approvedBy: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log(`📊 ${oldUsers.length} utilisateur(s) trouvé(s) dans l'ancienne base\n`)

    for (const oldUser of oldUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà dans la nouvelle base
        const existingUser = await mainPrisma.user.findUnique({
          where: { email: oldUser.email },
        })

        if (existingUser) {
          console.log(`⏭️  Utilisateur ${oldUser.email} existe déjà, ignoré`)
          continue
        }

        // Créer l'utilisateur dans la nouvelle base
        const newUser = await mainPrisma.user.create({
          data: {
            email: oldUser.email,
            password: oldUser.password,
            name: oldUser.name,
            role: oldUser.role,
            approved: oldUser.approved,
            approvedBy: oldUser.approvedBy,
            approvedAt: oldUser.approvedAt,
            createdAt: oldUser.createdAt,
            updatedAt: oldUser.updatedAt,
          },
        })

        console.log(`✅ Utilisateur ${oldUser.email} migré`)

        // Si l'utilisateur est approuvé, créer une entreprise et initialiser sa base
        if (oldUser.approved && oldUser.role !== 'admin') {
          const company = await mainPrisma.company.create({
            data: {
              name: `${oldUser.name} - Entreprise`,
              email: oldUser.email,
            },
          })

          await mainPrisma.user.update({
            where: { id: newUser.id },
            data: { companyId: company.id },
          })

          await initCompanyDatabase(company.id)

          console.log(`   └─ Entreprise créée: ${company.id}`)
        }
      } catch (error: any) {
        console.error(`❌ Erreur pour l'utilisateur ${oldUser.email}:`, error.message)
      }
    }

    console.log('\n✅ Migration terminée!')
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('ℹ️  L\'ancienne base de données n\'existe pas ou est vide')
    } else {
      console.error('❌ Erreur:', error)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await oldPrisma.$disconnect()
    await mainPrisma.$disconnect()
  })

