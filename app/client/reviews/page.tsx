import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMainPrisma, getUserPrisma } from '@/lib/db-manager'
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

  // Récupérer l'entreprise de l'utilisateur
  const mainPrisma = getMainPrisma()
  const dbUser = await mainPrisma.user.findUnique({
    where: { id: user.id },
    select: { companyId: true },
  })

  if (!dbUser?.companyId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Votre compte n'est pas encore lié à une entreprise.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Récupérer le client depuis la base de données de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Erreur de connexion à la base de données.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Trouver le customer par email de l'utilisateur
  const customer = await companyPrisma.customer.findFirst({
    where: { email: user.email },
  })

  if (!customer) {
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
          <ClientReviewForm customerId={customer.id} />
        </div>
      </main>
    </div>
  )
}
