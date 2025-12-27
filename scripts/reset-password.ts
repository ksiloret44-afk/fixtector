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
  console.log('=== Réinitialisation du mot de passe ===\n')

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
    console.log(`\n📋 Informations de l'utilisateur:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   Approuvé: ${user.approved ? '✅ Oui' : '❌ Non'}`)
    console.log(`   Suspendu: ${user.suspended ? '❌ Oui' : '✅ Non'}`)
    console.log(`   Doit changer le mot de passe: ${user.mustChangePassword ? '⚠️  Oui' : '✅ Non'}`)

    // Demander le nouveau mot de passe
    let password = await question('\nNouveau mot de passe: ')
    if (!password) {
      console.error('❌ Le mot de passe est requis')
      process.exit(1)
    }

    if (password.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères')
      process.exit(1)
    }

    // Demander confirmation
    const confirm = await question('Confirmer le nouveau mot de passe: ')
    if (password !== confirm) {
      console.error('❌ Les mots de passe ne correspondent pas')
      process.exit(1)
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        mustChangePassword: false, // Ne plus forcer le changement
        approved: true, // S'assurer que le compte est approuvé
        suspended: false, // S'assurer que le compte n'est pas suspendu
      }
    })

    console.log(`\n✅ Mot de passe réinitialisé avec succès pour ${email}!`)
    console.log(`   Le compte a également été approuvé et activé.`)
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
