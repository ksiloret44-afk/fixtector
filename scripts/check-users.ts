import { PrismaClient as MainPrismaClient } from '../node_modules/.prisma/client-main'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

async function main() {
  console.log('📊 Vérification des utilisateurs...\n')

  const users = await mainPrisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approved: true,
      companyId: true,
    },
  })

  console.log(`Total: ${users.length} utilisateur(s)\n`)

  for (const user of users) {
    console.log(`📧 ${user.email}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   Approuvé: ${user.approved ? '✅' : '❌'}`)
    console.log(`   Entreprise: ${user.companyId || '❌ Aucune'}`)
    console.log('')
  }

  const companies = await mainPrisma.company.findMany()
  console.log(`\n📊 Total entreprises: ${companies.length}\n`)

  for (const company of companies) {
    console.log(`🏢 ${company.name} (${company.id})`)
    const companyUsers = await mainPrisma.user.findMany({
      where: { companyId: company.id },
      select: { email: true },
    })
    console.log(`   Utilisateurs: ${companyUsers.map(u => u.email).join(', ') || 'Aucun'}`)
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await mainPrisma.$disconnect()
  })

