import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { checkAuthAndRedirect } from '@/lib/auth-helpers'
import Navigation from '@/components/Navigation'
import ChatbotInterface from '@/components/ChatbotInterface'

export default async function ChatbotPage() {
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
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Chatbot</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Posez vos questions sur FixTector et obtenez des réponses instantanées
            </p>
          </div>
          <ChatbotInterface />
        </div>
      </main>
    </div>
  )
}

