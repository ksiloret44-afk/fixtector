import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import ReviewsManagement from '@/components/ReviewsManagement'

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any
  
  // Vérifier si l'utilisateur doit changer son mot de passe
  if (user.mustChangePassword) {
    redirect('/change-password')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Gestion des avis clients</h1>
          <ReviewsManagement />
        </div>
      </main>
    </div>
  )
}

