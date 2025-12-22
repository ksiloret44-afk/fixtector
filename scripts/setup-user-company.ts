import { PrismaClient as MainPrismaClient } from '../node_modules/.prisma/client-main'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initCompanyDatabase } from '../lib/db-manager'

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
  const email = process.argv[2] || 'rpphone@ik.me'

  console.log(`🔍 Configuration de l'entreprise pour ${email}...`)

  try {
    const user = await mainPrisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé.`)
      process.exit(1)
    }

    if (user.companyId && user.company) {
      console.log(`✅ L'utilisateur a déjà une entreprise associée:`)
      console.log(`   Entreprise: ${user.company.name}`)
      console.log(`   ID: ${user.company.id}`)
      
      // Vérifier si la base de données de l'entreprise existe
      try {
        await initCompanyDatabase(user.company.id)
        console.log(`✅ Base de données de l'entreprise initialisée.`)
      } catch (error: any) {
        console.log(`⚠️  Erreur lors de l'initialisation de la base: ${error.message}`)
      }
    } else {
      console.log(`📦 Création d'une entreprise pour l'utilisateur...`)
      
      const company = await mainPrisma.company.create({
        data: {
          name: `${user.name} - Entreprise`,
          email: user.email,
        },
      })

      await mainPrisma.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      })

      console.log(`✅ Entreprise créée:`)
      console.log(`   Nom: ${company.name}`)
      console.log(`   ID: ${company.id}`)

      // Initialiser la base de données de l'entreprise
      try {
        await initCompanyDatabase(company.id)
        console.log(`✅ Base de données de l'entreprise initialisée.`)
      } catch (error: any) {
        console.log(`⚠️  Erreur lors de l'initialisation de la base: ${error.message}`)
      }
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    await mainPrisma.$disconnect()
  }
}

main()

