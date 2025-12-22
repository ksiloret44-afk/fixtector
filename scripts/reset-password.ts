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
  const newPassword = process.argv[3] || 'test123'

  if (!email || !newPassword) {
    console.log('Usage: npx tsx scripts/reset-password.ts <email> <nouveau_mot_de_passe>')
    console.log('Exemple: npx tsx scripts/reset-password.ts rpphone@ik.me test123')
    process.exit(1)
  }

  try {
    const user = await mainPrisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} n'existe pas.`)
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await mainPrisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    })

    console.log(`✅ Mot de passe réinitialisé pour ${email}`)
    console.log(`   Nouveau mot de passe: ${newPassword}`)
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await mainPrisma.$disconnect()
  }
}

main()

