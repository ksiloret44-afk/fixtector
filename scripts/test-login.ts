/**
 * Script de test pour vérifier la configuration de connexion
 * Ce script simule une requête de connexion NextAuth
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  console.log('🧪 Test de connexion complète\n')

  const email = 'admin@weqeep.com'
  const password = 'admin123'

  try {
    // 1. Vérifier l'utilisateur
    console.log('1️⃣  Recherche de l\'utilisateur...')
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return
    }
    console.log(`✅ Utilisateur trouvé: ${user.name}`)

    // 2. Vérifier le mot de passe
    console.log('\n2️⃣  Vérification du mot de passe...')
    const isValid = await bcrypt.compare(password, user.password)
    
    if (!isValid) {
      console.log('❌ Mot de passe incorrect')
      return
    }
    console.log('✅ Mot de passe correct')

    // 3. Vérifier les variables d'environnement
    console.log('\n3️⃣  Vérification des variables d\'environnement...')
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    }

    let allEnvOk = true
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        console.log(`✅ ${key}: défini`)
      } else {
        console.log(`❌ ${key}: NON DÉFINI`)
        allEnvOk = false
      }
    }

    if (!allEnvOk) {
      console.log('\n⚠️  Certaines variables d\'environnement ne sont pas définies!')
      console.log('   Assurez-vous que le fichier .env.local existe et contient:')
      console.log('   - DATABASE_URL')
      console.log('   - NEXTAUTH_SECRET')
      console.log('   - NEXTAUTH_URL')
      return
    }

    // 4. Résumé
    console.log('\n✅ Tous les tests sont passés!')
    console.log('\n📝 Informations de connexion:')
    console.log(`   Email: ${email}`)
    console.log(`   Mot de passe: ${password}`)
    console.log('\n💡 Si la connexion ne fonctionne toujours pas:')
    console.log('   1. Vérifiez que le serveur est redémarré après la création de .env.local')
    console.log('   2. Ouvrez la console du navigateur (F12) pour voir les erreurs')
    console.log('   3. Vérifiez les logs du serveur pour les erreurs NextAuth')

  } catch (error) {
    console.error('\n❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()

