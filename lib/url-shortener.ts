/**
 * Service de raccourcissement d'URL pour les SMS
 */
import crypto from 'crypto'
import { getUserPrisma, getMainPrisma, getCompanyPrisma } from './db-manager'
import { getBaseUrl } from './base-url'

/**
 * Génère un code court unique pour une URL
 */
function generateShortCode(): string {
  // Génère un code de 8 caractères alphanumériques
  // base64url peut générer des codes de longueur variable, on s'assure d'avoir au moins 6 caractères
  let code = crypto.randomBytes(4).toString('base64url')
  // Supprimer les caractères spéciaux et s'assurer d'avoir au moins 6 caractères
  code = code.replace(/[^a-zA-Z0-9_-]/g, '')
  if (code.length < 6) {
    // Si trop court, ajouter des caractères
    code += crypto.randomBytes(2).toString('base64url').replace(/[^a-zA-Z0-9_-]/g, '')
  }
  return code.substring(0, 8)
}

/**
 * Raccourcit une URL et la stocke en base de données
 */
export async function shortenUrl(longUrl: string, companyId?: string): Promise<string> {
  try {
    let companyPrisma = null
    
    // Essayer d'obtenir le contexte utilisateur
    if (!companyId) {
      companyPrisma = await getUserPrisma()
    } else {
      companyPrisma = getCompanyPrisma(companyId)
    }
    
    // Si pas de contexte utilisateur, chercher dans toutes les entreprises
    if (!companyPrisma) {
      const mainPrisma = getMainPrisma()
      const companies = await mainPrisma.company.findMany({
        select: { id: true },
        take: 10,
      })
      
      // Utiliser la première entreprise trouvée
      if (companies.length > 0) {
        companyPrisma = getCompanyPrisma(companies[0].id)
      } else {
        // Si aucune entreprise, retourner l'URL originale
        return longUrl
      }
    }

    // Vérifier d'abord si cette URL existe déjà avec un code court dans cette entreprise
    const existingSettings = await companyPrisma.settings.findMany({
      where: {
        key: { startsWith: 'short_url_' },
        value: longUrl,
      },
    })

    if (existingSettings.length > 0) {
      // URL déjà raccourcie, réutiliser le code existant
      const existingKey = existingSettings[0].key
      const existingCode = existingKey.replace('short_url_', '')
      console.log('[URL Shortener] URL déjà raccourcie, réutilisation du code:', existingCode, 'pour URL:', longUrl)
      
      const baseUrl = await getBaseUrl()
      return `${baseUrl}/s/${existingCode}`
    }

    // Si pas trouvé dans cette entreprise, chercher dans toutes les entreprises
    if (!companyId) {
      const mainPrisma = getMainPrisma()
      const allCompanies = await mainPrisma.company.findMany({
        select: { id: true },
        take: 50,
      })

      for (const company of allCompanies) {
        try {
          const otherCompanyPrisma = getCompanyPrisma(company.id)
          const otherSettings = await otherCompanyPrisma.settings.findMany({
            where: {
              key: { startsWith: 'short_url_' },
              value: longUrl,
            },
          })

          if (otherSettings.length > 0) {
            const existingKey = otherSettings[0].key
            const existingCode = existingKey.replace('short_url_', '')
            console.log('[URL Shortener] URL déjà raccourcie dans une autre entreprise, réutilisation du code:', existingCode)
            
            // Copier le code dans l'entreprise actuelle pour éviter les recherches futures
            await companyPrisma.settings.upsert({
              where: { key: `short_url_${existingCode}` },
              update: {
                value: longUrl,
                description: `URL raccourcie pour: ${longUrl.substring(0, 50)}...`,
              },
              create: {
                key: `short_url_${existingCode}`,
                value: longUrl,
                description: `URL raccourcie pour: ${longUrl.substring(0, 50)}...`,
              },
            })

            const baseUrl = await getBaseUrl()
            return `${baseUrl}/s/${existingCode}`
          }
        } catch (error) {
          // Continuer avec la prochaine entreprise
          continue
        }
      }
    }

    // Générer un code court unique
    let shortCode = generateShortCode()
    let attempts = 0
    const maxAttempts = 10

    // Vérifier que le code n'existe pas déjà
    while (attempts < maxAttempts) {
      const existing = await companyPrisma.settings.findUnique({
        where: { key: `short_url_${shortCode}` },
      })

      if (!existing) {
        break
      }

      shortCode = generateShortCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      // Si on n'a pas trouvé de code unique, retourner l'URL originale
      console.warn('[URL Shortener] Impossible de générer un code unique, utilisation de l\'URL originale')
      return longUrl
    }

    // Stocker l'URL raccourcie
    const settingKey = `short_url_${shortCode}`
    console.log('[URL Shortener] Stockage avec la clé:', settingKey, 'pour l\'URL:', longUrl)
    
    const result = await companyPrisma.settings.upsert({
      where: { key: settingKey },
      update: {
        value: longUrl,
        description: `URL raccourcie pour: ${longUrl.substring(0, 50)}...`,
      },
      create: {
        key: settingKey,
        value: longUrl,
        description: `URL raccourcie pour: ${longUrl.substring(0, 50)}...`,
      },
    })

    console.log('[URL Shortener] ✓ URL raccourcie créée/sauvegardée:', shortCode, '->', longUrl, 'ID:', result.id)
    
    // Vérifier que c'est bien stocké
    const verification = await companyPrisma.settings.findUnique({
      where: { key: settingKey },
    })
    if (verification) {
      console.log('[URL Shortener] ✓ Vérification: URL bien stockée, valeur:', verification.value)
    } else {
      console.error('[URL Shortener] ✗ ERREUR: URL non trouvée après stockage!')
    }

    // Récupérer le baseUrl pour construire l'URL raccourcie
    const baseUrl = await getBaseUrl()

    // Retourner l'URL raccourcie
    const shortUrl = `${baseUrl}/s/${shortCode}`
    console.log('[URL Shortener] URL raccourcie générée:', shortUrl)
    return shortUrl
  } catch (error: any) {
    console.error('[URL Shortener] Erreur lors du raccourcissement:', error)
    // En cas d'erreur, retourner l'URL originale
    return longUrl
  }
}

/**
 * Récupère l'URL originale à partir d'un code court
 */
export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  try {
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return null
    }

    const setting = await companyPrisma.settings.findUnique({
      where: { key: `short_url_${shortCode}` },
    })

    return setting?.value || null
  } catch (error: any) {
    console.error('[URL Shortener] Erreur lors de la récupération:', error)
    return null
  }
}

