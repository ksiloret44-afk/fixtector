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

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || email.split('@')[0]
  const role = process.argv[5] || 'user'

  if (!email || !password) {
    console.log('Usage: npx tsx scripts/create-user.ts <email> <password> [name] [role]')
    console.log('Exemple: npx tsx scripts/create-user.ts user@example.com password123 "Nom Utilisateur" admin')
    process.exit(1)
  }

  if (password.length < 6) {
    console.log('❌ Le mot de passe doit contenir au moins 6 caractères')
    process.exit(1)
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`⚠️  L'utilisateur ${email} existe déjà`)
      // Réinitialiser le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      })
      console.log(`✅ Mot de passe de ${email} réinitialisé avec succès`)
      console.log(`   Mot de passe: ${password}`)
    } else {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(password, 10)
      
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          approved: true,
        },
      })

      console.log(`✅ Utilisateur ${email} créé avec succès`)
      console.log(`   Nom: ${name}`)
      console.log(`   Rôle: ${role}`)
      console.log(`   Mot de passe: ${password}`)
    }
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()

