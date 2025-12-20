// Ce fichier est maintenant obsolète
// Utilisez getMainPrisma() ou getUserPrisma() depuis lib/db-manager.ts
import { getMainPrisma } from './db-manager'

// Export pour compatibilité avec l'ancien code (sera progressivement remplacé)
export const prisma = getMainPrisma()

