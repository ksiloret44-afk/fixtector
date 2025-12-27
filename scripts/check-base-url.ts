/**
 * Script pour vérifier si baseUrl existe dans toutes les entreprises
 */

import { getMainPrisma, getCompanyPrisma } from '../lib/db-manager'

async function checkBaseUrl() {
  console.log('=== VÉRIFICATION DU BASEURL DANS TOUTES LES ENTREPRISES ===\n')

  try {
    const mainPrisma = getMainPrisma()
    const companies = await mainPrisma.company.findMany({
      select: { id: true, name: true },
    })

    console.log(`Nombre d'entreprises trouvées: ${companies.length}\n`)

    let foundCount = 0
    const results: Array<{ companyId: string; companyName: string; baseUrl: string | null }> = []

    for (const company of companies) {
      try {
        const companyPrisma = getCompanyPrisma(company.id)
        const baseUrlSetting = await companyPrisma.settings.findUnique({
          where: { key: 'baseUrl' },
        })

        const baseUrl = baseUrlSetting?.value || null
        results.push({
          companyId: company.id,
          companyName: company.name,
          baseUrl,
        })

        if (baseUrl) {
          foundCount++
          console.log(`✓ Entreprise "${company.name}" (${company.id}):`)
          console.log(`  baseUrl = ${baseUrl}`)
        } else {
          console.log(`✗ Entreprise "${company.name}" (${company.id}): baseUrl non trouvé`)
        }
      } catch (err: any) {
        console.error(`⚠️ Erreur pour l'entreprise "${company.name}" (${company.id}):`, err.message)
        results.push({
          companyId: company.id,
          companyName: company.name,
          baseUrl: null,
        })
      }
    }

    console.log(`\n=== RÉSUMÉ ===`)
    console.log(`Total d'entreprises: ${companies.length}`)
    console.log(`Entreprises avec baseUrl: ${foundCount}`)
    console.log(`Entreprises sans baseUrl: ${companies.length - foundCount}`)

    if (foundCount === 0) {
      console.log('\n⚠️ ATTENTION: Aucun baseUrl trouvé dans aucune entreprise!')
      console.log('Le baseUrl doit être configuré via le formulaire Virtual Host.')
    } else {
      console.log('\n✓ baseUrl trouvé dans au moins une entreprise.')
    }

    return results
  } catch (error: any) {
    console.error('Erreur lors de la vérification:', error)
    throw error
  }
}

checkBaseUrl()
  .then(() => {
    console.log('\n=== VÉRIFICATION TERMINÉE ===')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur:', error)
    process.exit(1)
  })





