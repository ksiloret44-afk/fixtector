import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Wrench, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Récupérer la connexion Prisma de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  const customer = await companyPrisma.customer.findUnique({
    where: { id: params.id },
    include: {
      repairs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { repairs: true, invoices: true },
      },
    },
  })

  if (!customer) {
    redirect('/customers')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/customers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Link>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-bold text-2xl">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1.5" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1.5" />
                          {customer.email}
                        </div>
                      )}
                      {(customer.address || customer.city) && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5" />
                          {[customer.address, customer.city, customer.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/repairs/new?customerId=${customer.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Nouvelle réparation
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">Réparations</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {customer._count.repairs}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">Factures</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {customer._count.invoices}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">Client depuis</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-900 mb-2">Notes</h2>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {customer.notes}
                  </p>
                </div>
              )}

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Réparations récentes</h2>
                {customer.repairs.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune réparation pour ce client</p>
                ) : (
                  <div className="space-y-3">
                    {customer.repairs.map((repair) => (
                      <Link
                        key={repair.id}
                        href={`/repairs/${repair.id}`}
                        className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {repair.deviceType} - {repair.brand} {repair.model}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {repair.issue}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {repair.status === 'completed' ? 'Terminé' : 
                               repair.status === 'in_progress' ? 'En cours' : 'En attente'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(repair.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

