import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPrisma, getMainPrisma } from '@/lib/db-manager'
import Navigation from './Navigation'
import UpdateNotification from './UpdateNotification'
import DashboardChatbot from './DashboardChatbot'
import {
  Wrench,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Récupérer la connexion Prisma de l'entreprise de l'utilisateur
  const companyPrisma = await getUserPrisma()
  
  // Si l'utilisateur n'a pas de base d'entreprise, afficher un message
  if (!companyPrisma) {
    const mainPrisma = getMainPrisma()
    const user = await mainPrisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    })

    // Si c'est un admin, on peut quand même afficher le tableau de bord vide
    // ou rediriger vers l'administration
    if (user?.role === 'admin') {
      // Pour les admins, on affiche un tableau de bord vide mais avec la même structure
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Bienvenue, {session?.user?.name}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Voici un aperçu de votre activité
                </p>
              </div>

              {/* Statistiques vides pour les admins */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[
                  { name: 'Réparations en attente', value: 0, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', href: '/repairs?status=pending' },
                  { name: 'Réparations terminées', value: 0, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', href: '/repairs?status=completed' },
                  { name: 'Total clients', value: 0, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100', href: '/customers' },
                  { name: 'Chiffre d\'affaires', value: '0.00 €', icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-100', href: '/invoices' },
                ].map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Link
                      key={stat.name}
                      href={stat.href}
                      className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                            <Icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                {stat.name}
                              </dt>
                              <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {stat.value}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Réparations récentes vides */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Réparations récentes
                    </h2>
                    <Link
                      href="/repairs"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Voir tout
                    </Link>
                  </div>
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      <li className="py-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          Aucune réparation pour le moment
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )
    }

    // Pour les autres utilisateurs non approuvés
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Bienvenue, {session?.user?.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Votre compte est en attente d'approbation ou n'est pas encore associé à une entreprise.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Récupérer les statistiques depuis la base de données de l'entreprise
  const [
    totalRepairs,
    pendingRepairs,
    completedRepairs,
    totalCustomers,
    totalRevenue,
    thisMonthRevenue,
  ] = await Promise.all([
    companyPrisma.repair.count(),
    companyPrisma.repair.count({ where: { status: 'pending' } }),
    companyPrisma.repair.count({ where: { status: 'completed' } }),
    companyPrisma.customer.count(),
    companyPrisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: { paymentStatus: 'paid' },
    }),
    companyPrisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: {
        paymentStatus: 'paid',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ])

  const stats = [
    {
      name: 'Réparations en attente',
      value: pendingRepairs,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/repairs?status=pending',
    },
    {
      name: 'Réparations terminées',
      value: completedRepairs,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/repairs?status=completed',
    },
    {
      name: 'Total clients',
      value: totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/customers',
    },
    {
      name: 'Chiffre d\'affaires',
      value: `${(totalRevenue._sum.finalAmount || 0).toFixed(2)} €`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/invoices',
    },
  ]

  // Récupérer les dernières réparations
  const recentRepairs = await companyPrisma.repair.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <UpdateNotification />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Bienvenue, {session?.user?.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Voici un aperçu de votre activité
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link
                  key={stat.name}
                  href={stat.href}
                  className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            {stat.name}
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {stat.value}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Réparations récentes */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Réparations récentes
                </h2>
                <Link
                  href="/repairs"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Voir tout
                </Link>
              </div>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentRepairs.length === 0 ? (
                    <li className="py-5">
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Aucune réparation pour le moment
                      </p>
                    </li>
                  ) : (
                    recentRepairs.map((repair) => (
                      <li key={repair.id} className="py-5">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Wrench className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {repair.deviceType} - {repair.brand} {repair.model}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {repair.customer.firstName} {repair.customer.lastName}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                repair.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                  : repair.status === 'in_progress'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                  : repair.status === 'waiting_parts'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                                  : repair.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                  : repair.status === 'cancelled'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {repair.status === 'completed'
                                ? 'Terminée'
                                : repair.status === 'in_progress'
                                ? 'En cours'
                                : repair.status === 'waiting_parts'
                                ? 'En attente de pièces'
                                : repair.status === 'pending'
                                ? 'En attente'
                                : repair.status === 'cancelled'
                                ? 'Annulée'
                                : repair.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <DashboardChatbot />
    </div>
  )
}

