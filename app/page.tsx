import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any
  
  // Vérifier si l'utilisateur doit changer son mot de passe
  if (user.mustChangePassword) {
    redirect('/change-password')
  }
  
  // Rediriger les clients vers leur espace dédié
  if (user.role === 'client') {
    redirect('/client')
  }

  return <Dashboard />
}

