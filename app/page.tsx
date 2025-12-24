import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canUserAccess } from '@/lib/trial-checker'
import Dashboard from '@/components/Dashboard'
import TrialBlocked from '@/components/TrialBlocked'
import TrialWelcome from '@/components/TrialWelcome'
import UpdateNewsModal from '@/components/UpdateNewsModal'
import HelpRequestWidget from '@/components/HelpRequestWidget'

// Optimisation: Permettre le cache avec revalidation pour les données non sensibles
export const revalidate = 30

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Si l'utilisateur n'est pas connecté, afficher la page d'accueil marketing
  if (!session) {
    redirect('/landing')
  }

  const user = session.user as any
  
  // Vérifier si l'utilisateur doit changer son mot de passe
  if (user.mustChangePassword) {
    redirect('/change-password')
  }
  
  // Vérifier l'accès (abonnement ou essai)
  const access = await canUserAccess(user.id)
  
  // Si l'essai est expiré et pas d'abonnement, bloquer l'accès
  if (!access.canAccess && access.reason === 'expired') {
    return <TrialBlocked />
  }
  
  // Rediriger les clients vers leur espace dédié
  if (user.role === 'client') {
    redirect('/client')
  }

  return (
    <>
      <UpdateNewsModal />
      <TrialWelcome />
      <Dashboard />
      {user.role !== 'admin' && <HelpRequestWidget />}
    </>
  )
}

