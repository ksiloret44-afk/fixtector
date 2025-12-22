import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import NewPartForm from '@/components/NewPartForm'

export default async function NewPartPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Nouvelle pièce</h1>
            <p className="mt-2 text-gray-600">
              Ajoutez une nouvelle pièce détachée au stock
            </p>
          </div>
          <NewPartForm />
        </div>
      </main>
    </div>
  )
}

