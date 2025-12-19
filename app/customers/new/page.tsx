import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import NewCustomerForm from '@/components/NewCustomerForm'

export default async function NewCustomerPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Nouveau client</h1>
            <p className="mt-2 text-gray-600">
              Ajoutez un nouveau client à votre base de données
            </p>
          </div>
          <NewCustomerForm />
        </div>
      </main>
    </div>
  )
}

