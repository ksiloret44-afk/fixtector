import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
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

const prisma = new PrismaClient()

async function changePassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3] || 'password123'

  if (!email) {
    console.log('Usage: npx tsx scripts/change-password.ts <email> [nouveau_mot_de_passe]')
    console.log('Exemple: npx tsx scripts/change-password.ts user@example.com monNouveauMotDePasse')
    process.exit(1)
  }

  if (newPassword.length < 6) {
    console.log('❌ Le mot de passe doit contenir au moins 6 caractères')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} non trouvé`)
      process.exit(1)
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log(`✅ Mot de passe de ${email} réinitialisé avec succès`)
    console.log(`   Nouveau mot de passe: ${newPassword}`)
    console.log(`   ⚠️  Changez ce mot de passe après la première connexion!`)
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

changePassword()

