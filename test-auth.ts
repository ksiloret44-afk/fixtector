import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuth() {
  console.log('🔍 Test d\'authentification...\n')

  try {
    // 1. Vérifier que l'utilisateur existe
    console.log('1. Vérification de l\'utilisateur...')
    const user = await prisma.user.findUnique({
      where: { email: 'admin@fixtector.com' }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé!')
      console.log('   Exécutez: npm run db:init')
      return
    }

    console.log('✅ Utilisateur trouvé:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Hash du mot de passe: ${user.password.substring(0, 20)}...`)

    // 2. Tester le hash du mot de passe
    console.log('\n2. Test du mot de passe...')
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    
    if (isValid) {
      console.log('✅ Le mot de passe "admin123" est valide!')
    } else {
      console.log('❌ Le mot de passe "admin123" n\'est PAS valide!')
      console.log('   Le hash ne correspond pas au mot de passe.')
    }

    // 3. Vérifier les variables d'environnement
    console.log('\n3. Vérification des variables d\'environnement...')
    const dbUrl = process.env.DATABASE_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET
    const nextAuthUrl = process.env.NEXTAUTH_URL

    console.log(`   DATABASE_URL: ${dbUrl ? '✅ Défini' : '❌ Non défini'}`)
    console.log(`   NEXTAUTH_SECRET: ${nextAuthSecret ? '✅ Défini' : '❌ Non défini'}`)
    console.log(`   NEXTAUTH_URL: ${nextAuthUrl ? '✅ Défini' : '❌ Non défini'}`)

    if (!nextAuthSecret) {
      console.log('\n⚠️  NEXTAUTH_SECRET n\'est pas défini!')
      console.log('   Créez un fichier .env.local avec:')
      console.log('   NEXTAUTH_SECRET="votre-secret-ici"')
    }

    // 4. Test de connexion simulée
    console.log('\n4. Simulation de la connexion...')
    if (isValid && nextAuthSecret) {
      console.log('✅ Tous les tests sont passés!')
      console.log('   La connexion devrait fonctionner.')
      console.log('\n   Essayez de vous connecter avec:')
      console.log('   Email: admin@fixtector.com')
      console.log('   Mot de passe: admin123')
    } else {
      console.log('❌ Certains tests ont échoué.')
      if (!isValid) {
        console.log('   - Le mot de passe ne correspond pas')
      }
      if (!nextAuthSecret) {
        console.log('   - NEXTAUTH_SECRET n\'est pas défini')
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()

