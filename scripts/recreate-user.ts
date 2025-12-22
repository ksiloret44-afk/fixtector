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
  const password = process.argv[3] || 'test123'
  const role = process.argv[4] || 'admin'
  const name = process.argv[5] || 'RPPHONE Admin'

  console.log(`🔍 Vérification du compte ${email}...`)

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await mainPrisma.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (existingUser) {
      console.log(`✅ Le compte ${email} existe déjà.`)
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Nom: ${existingUser.name}`)
      console.log(`   Rôle: ${existingUser.role}`)
      console.log(`   Approuvé: ${existingUser.approved}`)
      console.log(`   Entreprise: ${existingUser.company?.name || 'Aucune'}`)
      
      // Proposer de réinitialiser le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)
      await mainPrisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: role,
          approved: true,
        },
      })
      
      console.log(`\n✅ Mot de passe réinitialisé et rôle mis à jour.`)
      console.log(`   Nouveau mot de passe: ${password}`)
      console.log(`   Rôle: ${role}`)
    } else {
      console.log(`❌ Le compte ${email} n'existe pas. Création...`)
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)

      // Créer l'utilisateur
      const newUser = await mainPrisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role,
          approved: true,
          approvedAt: new Date(),
        },
      })

      console.log(`✅ Compte créé avec succès!`)
      console.log(`   ID: ${newUser.id}`)
      console.log(`   Email: ${newUser.email}`)
      console.log(`   Nom: ${newUser.name}`)
      console.log(`   Rôle: ${newUser.role}`)
      console.log(`   Mot de passe: ${password}`)
      console.log(`   Approuvé: ${newUser.approved}`)
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    if (error.code === 'P2002') {
      console.error('   Un utilisateur avec cet email existe déjà.')
    }
    process.exit(1)
  } finally {
    await mainPrisma.$disconnect()
  }
}

main()

