'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Fermer le menu en cliquant en dehors et calculer la position
  useEffect(() => {
    if (openMenu && menuButtonRefs.current[openMenu]) {
      const button = menuButtonRefs.current[openMenu]
      const rect = button.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 224, // w-56 = 224px
      })
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu) {
        const button = menuButtonRefs.current[openMenu]
        if (
          menuRef.current && !menuRef.current.contains(event.target as Node) &&
          button && !button.contains(event.target as Node)
        ) {
          setOpenMenu(null)
          setMenuPosition(null)
        }
      }
    }

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Comptes actifs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{activeUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Essais 24h</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{trialUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <XCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Essais expirés</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{expiredTrials.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-visible relative">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Aucun utilisateur</h3>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expiration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date création</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
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
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.subscription?.currentPeriodEnd ? (
                        format(new Date(user.subscription.currentPeriodEnd), 'dd MMM yyyy', { locale: fr })
                      ) : user.trial ? (
                        format(new Date(user.trial.expiresAt), 'dd MMM yyyy HH:mm', { locale: fr })
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                        <button
                          ref={(el) => {
                            if (el) menuButtonRefs.current[user.id] = el
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenMenu(openMenu === user.id ? null : user.id)
                          }}
                          disabled={actionLoading === user.id}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          type="button"
                          aria-label="Menu d'actions"
                        >
                          {actionLoading === user.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                          ) : (
                            <MoreVertical className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Menu d'actions via Portal */}
      {typeof window !== 'undefined' && openMenu && menuPosition && (
        createPortal(
          <>
            <div 
              className="fixed inset-0 z-[99]" 
              onClick={() => {
                setOpenMenu(null)
                setMenuPosition(null)
              }}
            />
            <div 
              ref={menuRef}
              className="fixed w-56 bg-white dark:bg-gray-800 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-[100] border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                {(() => {
                  const user = filteredUsers.find(u => u.id === openMenu) || users.find(u => u.id === openMenu)
                  if (!user) {
                    setOpenMenu(null)
                    setMenuPosition(null)
                    return null
                  }
                  
                  return (
                    <>
                      {!user.trial && !user.subscription && (
                        <button
                          onClick={() => {
                            handleAction('create_trial', user.id)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un essai 24h
                        </button>
                      )}
                      {user.trial && !user.subscription && (
                        <button
                          onClick={() => {
                            handleAction('convert_to_subscription', user.id)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Convertir en abonnement
                        </button>
                      )}
                      {user.subscription && (
                        <button
                          onClick={() => {
                            handleAction('convert_to_trial', user.id)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Convertir en essai 24h
                        </button>
                      )}
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
                            handleAction('delete', user.id)
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          </>,
          document.body
        )
      )}
    </div>
  )
}

