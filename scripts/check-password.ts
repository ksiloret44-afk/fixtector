import { PrismaClient as MainPrismaClient } from '../node_modules/.prisma/client-main'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'

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
  const testPassword = process.argv[3] || 'test123'

  try {
    const user = await mainPrisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        approved: true,
      },
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} n'existe pas.`)
      process.exit(1)
    }

    console.log(`📧 Utilisateur trouvé: ${user.email}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   Approuvé: ${user.approved ? '✅' : '❌'}`)
    console.log(`   Hash du mot de passe: ${user.password.substring(0, 20)}...`)

    // Tester le mot de passe
    const isValid = await bcrypt.compare(testPassword, user.password)
    console.log(`\n🔐 Test du mot de passe "${testPassword}": ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`)

    if (!isValid) {
      console.log('\n🔄 Réinitialisation du mot de passe...')
      const hashedPassword = await bcrypt.hash(testPassword, 10)
      await mainPrisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      })
      console.log('✅ Mot de passe réinitialisé avec succès')
    }
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await mainPrisma.$disconnect()
  }
}

main()

