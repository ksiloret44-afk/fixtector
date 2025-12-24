import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMainPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import TeamManagement from '@/components/TeamManagement'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const mainPrisma = getMainPrisma()
  const currentUser = await mainPrisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { companyId: true, role: true },
  })

  if (!currentUser?.companyId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion des collaborateurs</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gérez les membres de votre équipe et leurs accès à votre écosystème
          </p>
        </div>
        <TeamManagement />
      </div>
    </div>
  )
}

