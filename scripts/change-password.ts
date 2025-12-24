import { getMainPrisma } from '../lib/db-manager'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    // Ignorer les commentaires et lignes vides
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) return
    
    const match = trimmedLine.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      // Enlever les guillemets au début et à la fin
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  })
  // Définir DATABASE_URL_MAIN par défaut si non défini
  if (!process.env.DATABASE_URL_MAIN) {
    process.env.DATABASE_URL_MAIN = `file:${resolve(process.cwd(), 'prisma', 'main.db')}`
  }
} catch (error) {
  console.error('Erreur lors du chargement de .env.local:', error)
  // Définir DATABASE_URL_MAIN par défaut même en cas d'erreur
  process.env.DATABASE_URL_MAIN = `file:${resolve(process.cwd(), 'prisma', 'main.db')}`
}

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
    const prisma = getMainPrisma()
    
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} non trouvé`)
      process.exit(1)
    }

    console.log(`[DEBUG] Utilisateur trouvé: ${user.email} (ID: ${user.id})`)
    console.log(`[DEBUG] Hash actuel commence par: ${user.password.substring(0, 20)}...`)

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log(`[DEBUG] Nouveau hash commence par: ${hashedPassword.substring(0, 20)}...`)

    // Mettre à jour le mot de passe
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log(`[DEBUG] Mot de passe mis à jour dans la base de données`)
    
    // Vérifier que le nouveau mot de passe fonctionne
    const verifyPassword = await bcrypt.compare(newPassword, updatedUser.password)
    if (!verifyPassword) {
      console.error(`❌ ERREUR: Le nouveau mot de passe ne correspond pas au hash stocké!`)
      process.exit(1)
    }
    
    console.log(`[DEBUG] Vérification réussie: le nouveau mot de passe fonctionne`)

    console.log(`✅ Mot de passe de ${email} réinitialisé avec succès`)
    console.log(`   Nouveau mot de passe: ${newPassword}`)
    console.log(`   ⚠️  Changez ce mot de passe après la première connexion!`)
  } catch (error: any) {
    console.error('Erreur:', error)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

changePassword()

