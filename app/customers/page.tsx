import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { Plus, Users, Phone, Mail } from 'lucide-react'

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Récupérer la connexion Prisma de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  const customers = await companyPrisma.customer.findMany({
    include: {
      _count: {
        select: { repairs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="mt-2 text-gray-600">
                Gérez votre base de clients
              </p>
            </div>
            <Link
              href="/customers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau client
            </Link>
          </div>

          {customers.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun client</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer votre premier client.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-medium">
                                  {customer.firstName[0]}{customer.lastName[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <span>{customer.phone}</span>
                                {customer.email && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                    <span>{customer.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500">
                              {customer._count.repairs} réparation{customer._count.repairs > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

