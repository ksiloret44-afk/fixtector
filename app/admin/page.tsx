import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import AdminDashboard from '@/components/AdminDashboard'
import SubscriptionsManagement from '@/components/SubscriptionsManagement'
import CompanyReviewsManagement from '@/components/CompanyReviewsManagement'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any
  
  // Vérifier si l'utilisateur doit changer son mot de passe
  if (user.mustChangePassword) {
    redirect('/change-password')
  }

  // Vérifier que l'utilisateur est admin
  if (user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <AdminDashboard />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gestion des abonnements</h2>
            <SubscriptionsManagement />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gestion des avis entreprises</h2>
            <CompanyReviewsManagement />
          </div>
        </div>
      </main>
    </div>
  )
}

