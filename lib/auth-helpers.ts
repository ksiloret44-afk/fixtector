import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

/**
 * Vérifie si l'utilisateur doit changer son mot de passe et redirige si nécessaire
 * À utiliser dans les pages serveur (Server Components)
 */
export async function checkMustChangePassword() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  const user = session.user as any
  
  if (user.mustChangePassword) {
    redirect('/change-password')
  }
  
  return session
}

/**
 * Vérifie si l'utilisateur doit changer son mot de passe et redirige si nécessaire
 * Version qui prend l'utilisateur en paramètre (pour éviter de refaire getServerSession)
 */
export function checkAuthAndRedirect(user: any) {
  if (user.mustChangePassword) {
    redirect('/change-password')
  }
  if (user.role === 'client') {
    redirect('/client')
  }
}

