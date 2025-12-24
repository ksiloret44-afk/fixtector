/**
 * Script pour tester la récupération de l'URL de base
 */

import { getBaseUrl } from '../lib/base-url'
import { getMainPrisma, getCompanyPrisma } from '../lib/db-manager'

async function testBaseUrl() {
  console.log('=== TEST DE L\'URL DE BASE ===\n')

  // Test 1: Récupérer toutes les entreprises et leurs settings
  console.log('1. Recherche dans toutes les entreprises...')
  const mainPrisma = getMainPrisma()
  const companies = await mainPrisma.company.findMany()
  
  console.log(`   Nombre d'entreprises: ${companies.length}`)
  
  for (const company of companies) {
    console.log(`\n   Entreprise: ${company.name} (ID: ${company.id})`)
    try {
      const companyPrisma = getCompanyPrisma(company.id)
      const settings = await companyPrisma.settings.findMany({
        where: { key: 'baseUrl' },
      })
      
      if (settings.length > 0) {
        console.log(`   ✓ baseUrl trouvé: ${settings[0].value}`)
      } else {
        console.log(`   ✗ baseUrl non trouvé`)
      }
      
      // Afficher tous les settings pour debug
      const allSettings = await companyPrisma.settings.findMany()
      console.log(`   Tous les settings (${allSettings.length}):`, allSettings.map(s => s.key).join(', '))
    } catch (err: any) {
      console.error(`   ✗ Erreur: ${err.message}`)
    }
  }

  // Test 2: Utiliser getBaseUrl()
  console.log('\n2. Test de getBaseUrl()...')
  try {
    const baseUrl = await getBaseUrl()
    console.log(`   ✓ URL récupérée: ${baseUrl}`)
  } catch (err: any) {
    console.error(`   ✗ Erreur: ${err.message}`)
  }

  // Test 3: Variables d'environnement
  console.log('\n3. Variables d\'environnement:')
  console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'non défini'}`)
  console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'non défini'}`)
  console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'non défini'}`)

  console.log('\n=== FIN DU TEST ===')
  process.exit(0)
}

testBaseUrl().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})









