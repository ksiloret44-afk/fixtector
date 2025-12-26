'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { DollarSign, Wrench, Users, TrendingUp, Download, UserCog } from 'lucide-react'

interface ReportData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  repairs: {
    total: number
    completed: number
    pending: number
    inProgress: number
  }
  customers: {
    total: number
    newThisMonth: number
  }
  dailyRevenue: Array<{ date: string; revenue: number }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
  repairsByStatus: Array<{ name: string; value: number }>
  topCustomers: Array<{ name: string; revenue: number }>
}

interface TeamStats {
  period: string
  startDate: string
  endDate: string
  teamStats: Array<{
    userId: string
    name: string
    email: string
    totalRepairs: number
    completedRepairs: number
    pendingRepairs: number
    inProgressRepairs: number
    revenue: number
    completedWithPayment: number
  }>
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [teamData, setTeamData] = useState<TeamStats | null>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchReports()
    fetchTeamReports()
  }, [period])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports?period=${period}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des rapports')
      }
      const reportData = await response.json()
      
      // Vérifier que les données sont complètes
      if (reportData && reportData.revenue && reportData.repairs && reportData.customers) {
        setData(reportData)
      } else {
        console.error('Données incomplètes:', reportData)
        setData(null)
      }
    } catch (err) {
      console.error('Erreur:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamReports = async () => {
    try {
      const response = await fetch(`/api/reports/team?period=${period}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des rapports par collaborateur')
      }
      const teamReportData = await response.json()
      setTeamData(teamReportData)
    } catch (err) {
      console.error('Erreur lors du chargement des rapports par collaborateur:', err)
      setTeamData(null)
    }
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/reports/export?format=${format}&period=${period}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${format}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'export')
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Chargement des rapports...</p>
      </div>
    )
  }

  if (!data || !data.revenue || !data.repairs || !data.customers) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Les données seront disponibles une fois que vous aurez créé des réparations et factures.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Période et export */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Année
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Chiffre d'affaires</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {data.revenue.total.toFixed(2)} €
                  </dd>
                  {data.revenue.growth !== 0 && (
                    <dd className={`text-xs ${data.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.revenue.growth > 0 ? '+' : ''}{data.revenue.growth.toFixed(1)}% vs mois précédent
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Réparations</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data.repairs.total}</dd>
                  <dd className="text-xs text-gray-500 dark:text-gray-400">
                    {data.repairs.completed} terminées
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Clients</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data.customers.total}</dd>
                  <dd className="text-xs text-gray-500 dark:text-gray-400">
                    {data.customers.newThisMonth} nouveaux ce mois
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Taux de complétion</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {data.repairs.total > 0
                      ? ((data.repairs.completed / data.repairs.total) * 100).toFixed(1)
                      : 0}%
                  </dd>
                  <dd className="text-xs text-gray-500 dark:text-gray-400">
                    {data.repairs.completed} / {data.repairs.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus quotidiens */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Revenus quotidiens</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number | undefined) => value ? `${value.toFixed(2)} €` : '0.00 €'} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Réparations par statut */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Réparations par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.repairsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.repairsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenus mensuels */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Revenus mensuels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number | undefined) => value ? `${value.toFixed(2)} €` : '0.00 €'} />
              <Legend />
              <Bar dataKey="revenue" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top clients */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Top 5 clients</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value: number | undefined) => value ? `${value.toFixed(2)} €` : '0.00 €'} />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rapport par collaborateur */}
      {teamData && teamData.teamStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-3">
                <UserCog className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Rapport par collaborateur
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Statistiques de vente et réparation pour chaque membre de l'équipe
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Collaborateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total réparations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Terminées
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    En cours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    En attente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chiffre d'affaires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Taux de complétion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teamData.teamStats.map((member) => (
                  <tr key={member.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {member.totalRepairs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                      {member.completedRepairs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                      {member.inProgressRepairs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                      {member.pendingRepairs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.revenue.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {member.totalRepairs > 0
                        ? ((member.completedRepairs / member.totalRepairs) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Graphique en barres pour le chiffre d'affaires par collaborateur */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              Chiffre d'affaires par collaborateur
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData.teamStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number | undefined) => value ? `${value.toFixed(2)} €` : '0.00 €'}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#4F46E5" name="Chiffre d'affaires (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

