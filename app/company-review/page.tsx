import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { checkAuthAndRedirect } from '@/lib/auth-helpers'
import Navigation from '@/components/Navigation'
import CompanyReviewForm from '@/components/CompanyReviewForm'

export default async function CompanyReviewPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = session.user as any
  
  checkAuthAndRedirect(user)

  // Seuls les utilisateurs non-admin peuvent laisser un avis sur la plateforme
  if (user.role === 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Laisser un avis sur FixTector</h1>
          <CompanyReviewForm />
        </div>
      </main>
    </div>
  )
}

