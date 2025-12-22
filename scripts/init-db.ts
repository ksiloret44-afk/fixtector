import { getMainPrisma } from '../lib/db-manager'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Initialisation de la base de données...')

  const prisma = getMainPrisma()

  try {
    // Créer un utilisateur admin par défaut si aucun utilisateur n'existe
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      await prisma.user.create({
        data: {
          email: 'admin@admin.com',
          password: hashedPassword,
          name: 'Administrateur',
          role: 'admin',
          approved: true,
          mustChangePassword: true, // Force le changement à la première connexion
        },
      })
      
      console.log('✅ Utilisateur admin créé:')
      console.log('   Email: admin@admin.com')
      console.log('   Mot de passe: admin123')
      console.log('   ⚠️  Changez ce mot de passe après la première connexion!')
    } else {
      console.log('✅ Base de données déjà initialisée')
    }
  } catch (error: any) {
    // Si la table n'existe pas encore, c'est normal lors de la première installation
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('⚠️  Les tables de la base de données ne sont pas encore créées.')
      console.log('   Exécutez "npx prisma db push" pour créer les tables, puis relancez ce script.')
      console.log('   Ou attendez que Prisma crée les tables automatiquement.')
    } else {
      throw error
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

