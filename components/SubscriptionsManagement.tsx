'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Clock, CheckCircle, XCircle, User, Mail, Calendar, MoreVertical, Trash2, ArrowRightLeft, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UserWithSubscription {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  subscription: {
    id: string
    status: string
    plan: string
    currentPeriodEnd: string | null
    stripeCustomerId: string | null
  } | null
  trial: {
    id: string
    expiresAt: string
    isActive: boolean
    welcomeMessageShown: boolean
  } | null
}

export default function SubscriptionsManagement() {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'trial'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu && !(event.target as Element).closest('.menu-container')) {
        setOpenMenu(null)
        setMenuPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenu])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions')
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const activeUsers = users.filter(u => u.subscription && u.subscription.status === 'active')
  const trialUsers = users.filter(u => u.trial && u.trial.isActive)
  const expiredTrials = users.filter(u => u.trial && !u.trial.isActive)

  const filteredUsers = filter === 'active' 
    ? activeUsers 
    : filter === 'trial' 
    ? trialUsers 
    : users

  const handleAction = async (action: string, userId: string) => {
    setActionLoading(userId)
    setOpenMenu(null)
    setMenuPosition(null)

    try {
      const response = await fetch('/api/admin/users/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Rafraîchir la liste
        await fetchUsers()
        alert(data.message || 'Action effectuée avec succès')
      } else {
        alert(data.error || 'Erreur lors de l\'action')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'action')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Comptes actifs</p>
              <p className="text-2xl font-semibold text-gray-900">{activeUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Essais 24h</p>
              <p className="text-2xl font-semibold text-gray-900">{trialUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <XCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Essais expirés</p>
              <p className="text-2xl font-semibold text-gray-900">{expiredTrials.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({users.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'active'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Actifs ({activeUsers.length})
          </button>
          <button
            onClick={() => setFilter('trial')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'trial'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Essais 24h ({trialUsers.length})
          </button>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white shadow rounded-lg overflow-visible">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subscription ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Abonnement
                        </span>
                      ) : user.trial ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Essai 24h
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Aucun
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subscription ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.subscription.status === 'active' ? 'Actif' : user.subscription.status}
                        </span>
                      ) : user.trial ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.trial.isActive
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {user.trial.isActive ? 'Actif' : 'Expiré'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.subscription?.currentPeriodEnd ? (
                        format(new Date(user.subscription.currentPeriodEnd), 'dd MMM yyyy', { locale: fr })
                      ) : user.trial ? (
                        format(new Date(user.trial.expiresAt), 'dd MMM yyyy HH:mm', { locale: fr })
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative menu-container">
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuPosition({
                              top: rect.bottom + window.scrollY,
                              right: window.innerWidth - rect.right,
                            })
                            setOpenMenu(openMenu === user.id ? null : user.id)
                          }}
                          disabled={actionLoading === user.id}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                          ) : (
                            <MoreVertical className="h-5 w-5" />
                          )}
                        </button>
                        {openMenu === user.id && menuPosition && (
                          <div 
                            className="fixed w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                            style={{ 
                              top: `${menuPosition.top}px`,
                              right: `${menuPosition.right}px`
                            }}
                          >
                            <div className="py-1">
                              {!user.trial && !user.subscription && (
                                <button
                                  onClick={() => handleAction('create_trial', user.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Créer un essai 24h
                                </button>
                              )}
                              {user.trial && !user.subscription && (
                                <button
                                  onClick={() => handleAction('convert_to_subscription', user.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Convertir en abonnement
                                </button>
                              )}
                              {user.subscription && (
                                <button
                                  onClick={() => handleAction('convert_to_trial', user.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Convertir en essai 24h
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
                                    handleAction('delete', user.id)
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

