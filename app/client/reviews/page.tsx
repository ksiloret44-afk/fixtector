import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMainPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import ClientReviewForm from '@/components/ClientReviewForm'

export default async function ClientReviewsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any
  
  if (user.role !== 'client') {
    redirect('/')
  }

  // Récupérer le Customer lié à l'utilisateur depuis la base principale
  const mainPrisma = getMainPrisma()
  const dbUser = await mainPrisma.user.findUnique({
    where: { id: user.id },
    select: { customerId: true },
  })

  if (!dbUser?.customerId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Votre compte n'est pas encore lié à un profil client.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Laisser un avis</h1>
          <ClientReviewForm customerId={dbUser.customerId} />
        </div>
      </main>
    </div>
  )
}
