import { PrismaClient as MainPrismaClient } from '../node_modules/.prisma/client-main'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'
import path from 'path'

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

const MAIN_DB_PATH = path.join(process.cwd(), 'prisma', 'main.db')
const dbUrl = `file:${MAIN_DB_PATH}`

console.log('🔍 Test de l\'authentification...')
console.log(`   Chemin de la base: ${MAIN_DB_PATH}`)
console.log(`   URL de la base: ${dbUrl}`)
console.log(`   Base existe: ${require('fs').existsSync(MAIN_DB_PATH) ? '✅' : '❌'}\n`)

const mainPrisma = new MainPrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
})

async function testAuth(email: string, password: string) {
  try {
    console.log(`🔐 Test de connexion pour: ${email}`)
    
    const user = await mainPrisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return false
    }

    console.log(`✅ Utilisateur trouvé: ${user.name}`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   Approuvé: ${user.approved ? '✅' : '❌'}`)

    const isValid = await bcrypt.compare(password, user.password)
    console.log(`   Mot de passe: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`)

    if (isValid && user.approved) {
      console.log('\n✅ Authentification réussie!')
      return true
    } else {
      console.log('\n❌ Authentification échouée')
      return false
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

async function main() {
  const email = process.argv[2] || 'rpphone@ik.me'
  const password = process.argv[3] || 'test123'

  await testAuth(email, password)
  
  await mainPrisma.$disconnect()
}

main()
