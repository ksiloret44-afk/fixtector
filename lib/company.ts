import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { getMainPrisma } from './db-manager'

/**
 * Récupère le companyId de l'utilisateur connecté
 * Retourne null si l'utilisateur n'a pas d'entreprise (admin système)
 */
export async function getUserCompanyId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  
  if (!session || !(session.user as any).id) {
    return null
  }

  const mainPrisma = getMainPrisma()
  const user = await mainPrisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { companyId: true, role: true },
  })

  // Les admins système (sans entreprise) peuvent voir toutes les données
  // Les autres utilisateurs ne voient que les données de leur entreprise
  if ((session.user as any).role === 'admin' && !user?.companyId) {
    return null // null signifie "pas de filtre" pour les admins système
  }

  return user?.companyId || null
}

/**
 * Construit une clause where pour filtrer par entreprise
 * Retourne un objet vide si l'utilisateur est admin système
 */
export async function getCompanyWhere(): Promise<{ companyId?: string } | {}> {
  const companyId = await getUserCompanyId()
  
  if (companyId === null) {
    return {} // Pas de filtre pour les admins système
  }
  
  return { companyId }
}

