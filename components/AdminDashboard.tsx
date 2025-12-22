'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, UserCheck, Clock } from 'lucide-react'
import UserManagement from './UserManagement'

interface Stats {
  totalUsers: number
  approvedUsers: number
  pendingUsers: number
  adminUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur:', err)
        setLoading(false)
      })
  }, [])

  if (loading || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  const statsData = [
    {
      name: 'Total utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Utilisateurs approuvés',
      value: stats.approvedUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'En attente d\'approbation',
      value: stats.pendingUsers,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Administrateurs',
      value: stats.adminUsers,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        <p className="mt-2 text-gray-600">
          Gérez les utilisateurs et les paramètres de l'application
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gestion des utilisateurs */}
      <UserManagement />
    </div>
  )
}
