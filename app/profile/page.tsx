import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMainPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import ProfileForm from '@/components/ProfileForm'
import BackupCodesManager from '@/components/BackupCodesManager'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const sessionUser = session.user as any
  
  // Vérifier si l'utilisateur doit changer son mot de passe
  if (sessionUser.mustChangePassword) {
    redirect('/change-password')
  }

  const mainPrisma = getMainPrisma()
  const user = await mainPrisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mon profil</h1>
          <ProfileForm user={user} />
          <BackupCodesManager />
        </div>
      </main>
    </div>
  )
}

