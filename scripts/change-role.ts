import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function changeRole() {
  const email = process.argv[2]
  const newRole = process.argv[3] || 'admin'

  if (!email) {
    console.log('Usage: npx tsx scripts/change-role.ts <email> [role]')
    console.log('Exemple: npx tsx scripts/change-role.ts rpphone@ik.me admin')
    process.exit(1)
  }

  if (newRole !== 'admin' && newRole !== 'user') {
    console.log('❌ Le rôle doit être "admin" ou "user"')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`❌ Utilisateur avec l'email ${email} non trouvé`)
      process.exit(1)
    }

    await prisma.user.update({
      where: { email },
      data: { role: newRole },
    })

    console.log(`✅ Rôle de ${email} changé en "${newRole}"`)
    console.log(`   Ancien rôle: ${user.role}`)
    console.log(`   Nouveau rôle: ${newRole}`)
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

changeRole()

