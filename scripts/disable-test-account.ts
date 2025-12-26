import { getMainPrisma } from '../lib/db-manager'

const mainPrisma = getMainPrisma()

async function disableTestAccount() {
  try {
    const email = 'test@test.com'
    
    console.log(`Recherche du compte ${email}...`)
    
    // Trouver l'utilisateur
    const user = await mainPrisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        trial: true,
      },
    })

    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé`)
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.name} (${user.email})`)
    console.log(`   Rôle: ${user.role}`)
    console.log(`   ID: ${user.id}`)

    // Supprimer l'abonnement s'il existe
    if (user.subscription) {
      console.log(`\n📦 Suppression de l'abonnement...`)
      await mainPrisma.subscription.delete({
        where: { id: user.subscription.id },
      })
      console.log(`✅ Abonnement supprimé`)
    } else {
      console.log(`\nℹ️  Aucun abonnement trouvé`)
    }

    // Supprimer l'essai s'il existe
    if (user.trial) {
      console.log(`\n⏱️  Suppression de l'essai...`)
      await mainPrisma.trial.delete({
        where: { id: user.trial.id },
      })
      console.log(`✅ Essai supprimé`)
    } else {
      console.log(`\nℹ️  Aucun essai trouvé`)
    }

    console.log(`\n✅ Compte ${email} désactivé avec succès !`)
    console.log(`   Le compte devrait maintenant afficher le message de blocage d'abonnement.`)
  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await mainPrisma.$disconnect()
  }
}

disableTestAccount()
  .then(() => {
    console.log('\n✅ Terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  })

