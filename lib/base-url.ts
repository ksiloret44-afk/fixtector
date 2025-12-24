import { getMainPrisma, getUserPrisma, getCompanyPrisma } from './db-manager'

// Cache pour l'URL de base (évite les requêtes répétées)
let cachedBaseUrl: string | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5000 // 5 secondes seulement pour le debug

/**
 * Obtient l'URL de base de l'application
 * Priorité:
 * 1. Paramètre "baseUrl" dans la base de données (toutes les entreprises)
 * 2. Variable d'environnement NEXTAUTH_URL
 * 3. Variable d'environnement NEXT_PUBLIC_APP_URL
 * 4. Variable d'environnement NEXT_PUBLIC_BASE_URL
 * 5. localhost par défaut
 */
export async function getBaseUrl(): Promise<string> {
  // Vérifier le cache
  const now = Date.now()
  if (cachedBaseUrl && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('[getBaseUrl] Utilisation du cache:', cachedBaseUrl)
    return cachedBaseUrl
  }
  
  console.log('[getBaseUrl] Cache expiré ou vide, recherche dans la base de données...')

  try {
    // Essayer d'abord avec getUserPrisma (si session disponible)
    try {
      const companyPrisma = await getUserPrisma()
      if (companyPrisma) {
        console.log('[getBaseUrl] Recherche avec getUserPrisma...')
        const baseUrlSetting = await companyPrisma.settings.findUnique({
          where: { key: 'baseUrl' },
        })
        
        console.log('[getBaseUrl] Résultat getUserPrisma:', baseUrlSetting)
        
        if (baseUrlSetting?.value) {
          const url = baseUrlSetting.value.replace(/\/$/, '')
          console.log('[getBaseUrl] ✓ URL trouvée dans la base de données (via getUserPrisma):', url)
          cachedBaseUrl = url
          cacheTimestamp = now
          return url
        } else {
          console.log('[getBaseUrl] ✗ Aucune URL trouvée avec getUserPrisma')
        }
      } else {
        console.log('[getBaseUrl] getUserPrisma retourne null')
      }
    } catch (userPrismaError: any) {
      // Pas de session disponible, continuer avec la recherche dans toutes les entreprises
      console.log('[getBaseUrl] Pas de session disponible, recherche dans toutes les entreprises...', userPrismaError?.message)
    }
    
    // Si pas de session, essayer de récupérer depuis toutes les entreprises
    // On cherche dans la première entreprise qui a ce paramètre
    console.log('[getBaseUrl] Recherche dans toutes les entreprises...')
    const mainPrisma = getMainPrisma()
    const companies = await mainPrisma.company.findMany({
      take: 10, // Limiter à 10 entreprises pour éviter de surcharger
    })
    
    console.log('[getBaseUrl] Nombre d\'entreprises trouvées:', companies.length)
    
    for (const company of companies) {
      try {
        console.log('[getBaseUrl] Recherche dans l\'entreprise:', company.id, company.name)
        const companyPrisma = getCompanyPrisma(company.id)
        if (companyPrisma) {
          const baseUrlSetting = await companyPrisma.settings.findUnique({
            where: { key: 'baseUrl' },
          })
          
          console.log('[getBaseUrl] Résultat pour entreprise', company.id, ':', baseUrlSetting)
          
          if (baseUrlSetting?.value) {
            const url = baseUrlSetting.value.replace(/\/$/, '')
            console.log('[getBaseUrl] ✓ URL trouvée dans la base de données (via getCompanyPrisma):', url)
            cachedBaseUrl = url
            cacheTimestamp = now
            return url
          }
        }
      } catch (err: any) {
        console.error('[getBaseUrl] Erreur pour entreprise', company.id, ':', err.message)
        // Continuer avec la prochaine entreprise
        continue
      }
    }
    
    console.log('[getBaseUrl] ✗ Aucune URL trouvée dans aucune entreprise')
  } catch (error: any) {
    console.error('[getBaseUrl] Erreur lors de la récupération de l\'URL de base depuis la base de données:', error.message || error)
  }

  // Fallback sur les variables d'environnement
  const fallbackUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3001'
  ).replace(/\/$/, '')
  
  console.log('[getBaseUrl] Utilisation de l\'URL de fallback:', fallbackUrl)
  cachedBaseUrl = fallbackUrl
  cacheTimestamp = now
  return fallbackUrl
}

/**
 * Invalide le cache de l'URL de base (à appeler après une mise à jour)
 */
export function invalidateBaseUrlCache(): void {
  cachedBaseUrl = null
  cacheTimestamp = 0
  console.log('[getBaseUrl] Cache invalidé')
}

/**
 * Force le rechargement de l'URL de base depuis la base de données
 * Utile au démarrage du serveur ou après une mise à jour
 */
export async function reloadBaseUrl(): Promise<string> {
  console.log('[getBaseUrl] Rechargement forcé de l\'URL de base...')
  invalidateBaseUrlCache()
  return await getBaseUrl()
}

/**
 * Version synchrone pour obtenir l'URL de base (utilise uniquement les variables d'environnement)
 * À utiliser dans les composants client ou quand on ne peut pas faire d'appel async
 */
export function getBaseUrlSync(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3001'
  ).replace(/\/$/, '')
}

