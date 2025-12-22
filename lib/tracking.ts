/**
 * Gestion des tokens de suivi pour les réparations
 */
import crypto from 'crypto'

/**
 * Génère un token unique pour le suivi d'une réparation
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Génère l'URL de suivi publique
 */
export function getTrackingUrl(token: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${url}/track/${token}`
}

