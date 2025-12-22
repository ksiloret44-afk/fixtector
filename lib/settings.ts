import { getUserPrisma } from './db-manager'

let cachedSettings: Record<string, string> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minute

export async function getSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  
  // Utiliser le cache si disponible et récent
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings
  }

  try {
    const companyPrisma = await getUserPrisma()
    if (!companyPrisma) {
      return {}
    }
    
    const settings = await companyPrisma.settings.findMany()
    const settingsMap: Record<string, string> = {}
    
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value
    })

    // Mettre en cache
    cachedSettings = settingsMap
    cacheTimestamp = now

    return settingsMap
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return {}
  }
}

export async function getTaxRate(): Promise<number> {
  const settings = await getSettings()
  const companyType = settings.companyType || 'auto-entrepreneur'
  
  // Si auto-entrepreneur, TVA à 0% par défaut
  if (companyType === 'auto-entrepreneur') {
    return 0.0
  }
  
  const taxRate = parseFloat(settings.taxRate || '20.0')
  return isNaN(taxRate) ? 20.0 : taxRate
}

export async function getCompanyType(): Promise<string> {
  const settings = await getSettings()
  return settings.companyType || 'auto-entrepreneur'
}

export function clearSettingsCache() {
  cachedSettings = null
  cacheTimestamp = 0
}

