import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🔧 Configuration des bases de données multiples...\n')

// Créer le dossier des bases de données d'entreprise
const companiesDir = path.join(process.cwd(), 'prisma', 'companies')
if (!fs.existsSync(companiesDir)) {
  fs.mkdirSync(companiesDir, { recursive: true })
  console.log('✅ Dossier companies créé')
}

// Générer les clients Prisma pour les deux schémas
console.log('\n📦 Génération du client Prisma pour la base principale...')
try {
  process.env.DATABASE_URL_MAIN = `file:${path.join(process.cwd(), 'prisma', 'main.db')}`
  execSync('npx prisma generate --schema=prisma/schema-main.prisma', {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  console.log('✅ Client Prisma principal généré')
} catch (error) {
  console.error('❌ Erreur lors de la génération du client principal:', error)
}

console.log('\n📦 Génération du client Prisma pour les bases d\'entreprise...')
try {
  execSync('npx prisma generate --schema=prisma/schema-company.prisma', {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  console.log('✅ Client Prisma entreprise généré')
} catch (error) {
  console.error('❌ Erreur lors de la génération du client entreprise:', error)
}

// Initialiser la base principale
console.log('\n🗄️  Initialisation de la base de données principale...')
try {
  process.env.DATABASE_URL_MAIN = `file:${path.join(process.cwd(), 'prisma', 'main.db')}`
  execSync('npx prisma db push --schema=prisma/schema-main.prisma', {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  console.log('✅ Base de données principale initialisée')
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de la base principale:', error)
}

console.log('\n✅ Configuration terminée!')
console.log('\n📝 Note: Ajoutez DATABASE_URL_MAIN="file:./prisma/main.db" à votre .env.local')

