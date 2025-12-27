import { getMainPrisma } from '../lib/db-manager'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('=== Diagnostic et réparation de compte utilisateur ===\n')

  const prisma = getMainPrisma()

  try {
    // Demander l'email
    const email = await question('Email de l\'utilisateur: ')
    if (!email) {
      console.error('❌ L\'email est requis')
      process.exit(1)
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`)
      process.exit(1)
    }

    // Afficher les informations de l'utilisateur
    console.log(`\n📋 État actuel du compte:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   Approuvé: ${user.approved ? '✅ Oui' : '❌ Non (PROBLÈME!)'}`)
    console.log(`   Suspendu: ${user.suspended ? '❌ Oui (PROBLÈME!)' : '✅ Non'}`)
    console.log(`   Doit changer le mot de passe: ${user.mustChangePassword ? '⚠️  Oui' : '✅ Non'}`)

    // Identifier les problèmes
    const problems: string[] = []
    if (!user.approved) {
      problems.push('Compte non approuvé')
    }
    if (user.suspended) {
      problems.push('Compte suspendu')
    }

    if (problems.length > 0) {
      console.log(`\n⚠️  Problèmes détectés: ${problems.join(', ')}`)
      const fix = await question('\nVoulez-vous corriger ces problèmes? (o/n): ')
      if (fix.toLowerCase() === 'o' || fix.toLowerCase() === 'oui') {
        await prisma.user.update({
          where: { email },
          data: {
            approved: true,
            suspended: false,
          }
        })
        console.log('✅ Problèmes corrigés!')
      }
    } else {
      console.log('\n✅ Aucun problème détecté avec l\'approbation/suspension.')
    }

    // Demander si on veut réinitialiser le mot de passe
    const resetPassword = await question('\nVoulez-vous réinitialiser le mot de passe? (o/n): ')
    if (resetPassword.toLowerCase() === 'o' || resetPassword.toLowerCase() === 'oui') {
      let password = await question('Nouveau mot de passe: ')
      if (!password) {
        console.error('❌ Le mot de passe est requis')
        process.exit(1)
      }

      if (password.length < 6) {
        console.error('❌ Le mot de passe doit contenir au moins 6 caractères')
        process.exit(1)
      }

      const confirm = await question('Confirmer le nouveau mot de passe: ')
      if (password !== confirm) {
        console.error('❌ Les mots de passe ne correspondent pas')
        process.exit(1)
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
        }
      })

      console.log('✅ Mot de passe réinitialisé!')
    }

    // Afficher le résumé final
    const finalUser = await prisma.user.findUnique({
      where: { email }
    })

    if (finalUser) {
      console.log(`\n📋 État final du compte:`)
      console.log(`   Email: ${finalUser.email}`)
      console.log(`   Nom: ${finalUser.name}`)
      console.log(`   Rôle: ${finalUser.role}`)
      console.log(`   Approuvé: ${finalUser.approved ? '✅ Oui' : '❌ Non'}`)
      console.log(`   Suspendu: ${finalUser.suspended ? '❌ Oui' : '✅ Non'}`)
      console.log(`   Doit changer le mot de passe: ${finalUser.mustChangePassword ? '⚠️  Oui' : '✅ Non'}`)
      
      if (finalUser.approved && !finalUser.suspended) {
        console.log('\n✅ Le compte est maintenant opérationnel!')
      } else {
        console.log('\n⚠️  Le compte nécessite encore des corrections.')
      }
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('\n⚠️  Les tables de la base de données ne sont pas encore créées.')
      console.log('   Exécutez "npm run db:push" pour créer les tables.')
    }
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

