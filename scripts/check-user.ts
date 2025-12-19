import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Vérification des utilisateurs...\n')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé dans la base de données')
    console.log('Exécutez: npm run db:init')
  } else {
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`)
    users.forEach((user) => {
      console.log(`  - Email: ${user.email}`)
      console.log(`    Nom: ${user.name}`)
      console.log(`    Rôle: ${user.role}`)
      console.log(`    Créé le: ${user.createdAt}\n`)
    })
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

