import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Initialisation de la base de données...')

  // Créer un utilisateur admin par défaut si aucun utilisateur n'existe
  const userCount = await prisma.user.count()
  
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    await prisma.user.create({
      data: {
        email: 'admin@rpphone.com',
        password: hashedPassword,
        name: 'Administrateur',
        role: 'admin',
        approved: true,
      },
    })
    
    console.log('✅ Utilisateur admin créé:')
    console.log('   Email: admin@rpphone.com')
    console.log('   Mot de passe: admin123')
    console.log('   ⚠️  Changez ce mot de passe après la première connexion!')
  } else {
    console.log('✅ Base de données déjà initialisée')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

