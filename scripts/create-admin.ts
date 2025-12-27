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
  console.log('=== Création d\'un utilisateur administrateur ===\n')

  const prisma = getMainPrisma()

  try {
    // Demander les informations
    const email = await question('Email: ')
    if (!email) {
      console.error('❌ L\'email est requis')
      process.exit(1)
    }

    const name = await question('Nom: ') || 'Administrateur'
    
    let password = await question('Mot de passe: ')
    if (!password) {
      console.error('❌ Le mot de passe est requis')
      process.exit(1)
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      const update = await question(`L'utilisateur ${email} existe déjà. Voulez-vous le mettre à jour? (o/n): `)
      if (update.toLowerCase() !== 'o' && update.toLowerCase() !== 'oui') {
        console.log('❌ Opération annulée')
        process.exit(0)
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          role: 'admin',
          approved: true,
          mustChangePassword: false,
        }
      })

      console.log(`\n✅ Utilisateur ${email} mis à jour avec succès!`)
      console.log(`   Rôle: admin`)
      console.log(`   Approuvé: oui`)
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'admin',
          approved: true,
          mustChangePassword: false,
        }
      })

      console.log(`\n✅ Utilisateur administrateur créé avec succès!`)
      console.log(`   Email: ${email}`)
      console.log(`   Nom: ${name}`)
      console.log(`   Rôle: admin`)
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

