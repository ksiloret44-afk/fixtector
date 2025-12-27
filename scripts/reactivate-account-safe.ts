import { getMainPrisma } from '../lib/db-manager'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('=== Réactivation du compte rpphone@ik.me ===\n')

  const prisma = getMainPrisma()

  try {
    const email = 'rpphone@ik.me'
    
    // Chercher l'utilisateur avec seulement les champs de base
    let user: any = null
    try {
      user = await prisma.user.findUnique({
        where: { email }
      })
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === 'P2021') {
        console.log('⚠️  Les tables de la base de données ne sont pas encore créées.')
        console.log('   Exécutez "npm run db:push" pour créer les tables.')
        process.exit(1)
      }
      throw error
    }

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`)
      console.log('\n💡 Création du compte...')
      
      // Créer le compte s'il n'existe pas
      const defaultPassword = 'admin123'
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)
      
      const createData: any = {
        email,
        name: 'Administrateur',
        password: hashedPassword,
        role: 'admin',
        approved: true,
        mustChangePassword: true,
      }
      
      // Ajouter suspended seulement si la colonne existe
      try {
        // Tester si suspended existe en vérifiant le schéma
        createData.suspended = false
      } catch (e) {
        // Ignorer si la colonne n'existe pas
      }
      
      const newUser = await prisma.user.create({
        data: createData
      })
      
      console.log('✅ Compte créé avec succès!')
      console.log(`   Email: ${newUser.email}`)
      console.log(`   Mot de passe par défaut: ${defaultPassword}`)
      console.log(`   ⚠️  Changez ce mot de passe après la première connexion!`)
      return
    }

    // Afficher l'état actuel
    console.log(`📋 État actuel du compte:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nom: ${user.name}`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   Approuvé: ${user.approved ? '✅ Oui' : '❌ Non'}`)
    if (user.suspended !== undefined) {
      console.log(`   Suspendu: ${user.suspended ? '❌ Oui' : '✅ Non'}`)
    }

    // Réactiver le compte
    const updateData: any = {
      approved: true,
      mustChangePassword: false,
    }
    
    // Ajouter suspended seulement si la colonne existe dans le schéma
    if (user.suspended !== undefined) {
      updateData.suspended = false
    }
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData
    })

    console.log('\n✅ Compte réactivé avec succès!')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Approuvé: ${updatedUser.approved ? '✅ Oui' : '❌ Non'}`)
    if (updatedUser.suspended !== undefined) {
      console.log(`   Suspendu: ${updatedUser.suspended ? '❌ Oui' : '✅ Non'}`)
    }
    console.log('\n💡 Vous pouvez maintenant vous connecter avec votre mot de passe.')
    
    // Option pour réinitialiser le mot de passe
    console.log('\n💡 Si vous avez oublié votre mot de passe, utilisez:')
    console.log('   npm run reset-password')
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('\n⚠️  Les tables de la base de données ne sont pas encore créées.')
      console.log('   Exécutez "npm run db:push" pour créer les tables.')
      console.log('\n📝 Commandes à exécuter:')
      console.log('   1. npm run db:push')
      console.log('   2. npm run db:generate')
      console.log('   3. npm run reactivate-account')
    } else if (error.message?.includes('suspended')) {
      console.log('\n⚠️  La colonne "suspended" n\'existe pas dans votre base de données.')
      console.log('   Exécutez "npm run db:push" pour mettre à jour le schéma.')
    }
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

