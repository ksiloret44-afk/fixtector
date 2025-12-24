import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserPrisma } from '@/lib/db-manager'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { Plus, Wrench, Search } from 'lucide-react'
import RepairList from '@/components/RepairList'

export default async function RepairsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const where: any = {}
  if (searchParams.status) {
    where.status = searchParams.status
  }
  if (searchParams.search) {
    where.OR = [
      { deviceType: { contains: searchParams.search, mode: 'insensitive' } },
      { brand: { contains: searchParams.search, mode: 'insensitive' } },
      { model: { contains: searchParams.search, mode: 'insensitive' } },
      { customer: { firstName: { contains: searchParams.search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  // Récupérer la connexion Prisma de l'entreprise
  const companyPrisma = await getUserPrisma()
  if (!companyPrisma) {
    redirect('/')
  }

  // Optimisation: Limiter et utiliser select spécifique
  const repairs = await companyPrisma.repair.findMany({
    where,
    take: 100, // Limiter à 100 réparations (ajouter pagination si nécessaire)
    select: {
      id: true,
      ticketNumber: true,
      deviceType: true,
      brand: true,
      model: true,
      status: true,
      estimatedCost: true,
      finalCost: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusCounts = await Promise.all([
    companyPrisma.repair.count({ where: { status: 'pending' } }),
    companyPrisma.repair.count({ where: { status: 'in_progress' } }),
    companyPrisma.repair.count({ where: { status: 'waiting_parts' } }),
    companyPrisma.repair.count({ where: { status: 'completed' } }),
    companyPrisma.repair.count({ where: { status: 'cancelled' } }),
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Réparations</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gérez toutes vos réparations en un seul endroit
              </p>
            </div>
            <Link
              href="/repairs/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle réparation
            </Link>
          </div>

          {/* Filtres de statut */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/repairs"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !searchParams.status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Tous ({repairs.length})
            </Link>
            <Link
              href="/repairs?status=pending"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                searchParams.status === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              En attente ({statusCounts[0]})
            </Link>
            <Link
              href="/repairs?status=in_progress"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                searchParams.status === 'in_progress'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              En cours ({statusCounts[1]})
            </Link>
            <Link
              href="/repairs?status=waiting_parts"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                searchParams.status === 'waiting_parts'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              En attente de pièces ({statusCounts[2]})
            </Link>
            <Link
              href="/repairs?status=completed"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                searchParams.status === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Terminées ({statusCounts[3]})
            </Link>
          </div>

          <RepairList repairs={repairs} />
        </div>
      </main>
    </div>
  )
}

