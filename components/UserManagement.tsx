'use client'

import { useState, useEffect } from 'react'
import { UserCheck, UserX, Shield, Mail, Calendar, CheckCircle, XCircle, Clock, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import UserActionsMenu from './UserActionsMenu'

interface User {
  id: string
  name: string
  email: string
  role: string
  approved: boolean
  suspended: boolean
  createdAt: Date
  approvedAt: Date | null
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [editData, setEditData] = useState({ name: '', email: '' })

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users?filter=${filter}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        alert('Utilisateur approuvé avec succès')
      } else {
        alert(`Erreur: ${data.error || 'Impossible d\'approuver l\'utilisateur'}`)
        console.error('Erreur d\'approbation:', data)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue lors de l\'approbation')
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cet utilisateur ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${newRole}" ? L'utilisateur devra se reconnecter pour que les changements prennent effet.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        alert(data.message || `Rôle changé en "${newRole}" avec succès. L'utilisateur devra se reconnecter.`)
      } else {
        alert(`Erreur: ${data.error || 'Impossible de changer le rôle'}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue lors du changement de rôle')
    }
  }

  const handleSuspend = async (userId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: suspend }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        alert(data.message || (suspend ? 'Compte suspendu avec succès' : 'Compte réactivé avec succès'))
      } else {
        alert(`Erreur: ${data.error || 'Impossible de modifier le statut'}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        fetchUsers()
        alert('Utilisateur supprimé avec succès')
      } else {
        alert(`Erreur: ${data.error || 'Impossible de supprimer l\'utilisateur'}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const handleChangePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowPasswordModal(null)
        setNewPassword('')
        alert('Mot de passe modifié avec succès')
      } else {
        alert(`Erreur: ${data.error || 'Impossible de modifier le mot de passe'}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const handleViewDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedUser(data.user)
        setShowDetailsModal(userId)
      } else {
        alert(`Erreur: ${data.error || 'Impossible de charger les détails'}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const handleEdit = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setEditData({ name: user.name, email: user.email })
      setShowEditModal(userId)
    }
  }

  const handleUpdateUser = async (userId: string) => {
    if (!editData.name || !editData.email) {
      alert('Le nom et l\'email sont requis')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditModal(null)
        setEditData({ name: '', email: '' })
        fetchUsers()
        alert('Informations mises à jour avec succès')
      } else {
        alert(`Erreur: ${data.error || 'Impossible de mettre à jour les informations'}`)
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter === 'pending') return !user.approved
    if (filter === 'approved') return user.approved
    return true
  })

  return (
      <div className="bg-white shadow rounded-lg" style={{ overflow: 'visible' }}>
        <div className="px-4 py-5 sm:p-6" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Gestion des utilisateurs</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'approved'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvés
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ overflowY: 'visible', position: 'relative' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {user.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Approuvé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            En attente
                          </span>
                        )}
                        {user.suspended && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Ban className="w-3 h-3 mr-1" />
                            Suspendu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ position: 'relative' }}>
                      <div className="flex items-center space-x-2">
                        {!user.approved ? (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="text-green-600 hover:text-green-900 inline-flex items-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approuver
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeter
                            </button>
                          </>
                        ) : (
                          <UserActionsMenu
                            userId={user.id}
                            suspended={user.suspended}
                            onPasswordChange={() => setShowPasswordModal(user.id)}
                            onSuspend={() => handleSuspend(user.id, !user.suspended)}
                            onDelete={() => handleDelete(user.id)}
                            onEdit={() => handleEdit(user.id)}
                            onViewDetails={() => handleViewDetails(user.id)}
                          />
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

      {/* Modal pour changer le mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(null)
                    setNewPassword('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleChangePassword(showPasswordModal)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour modifier les informations */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier les informations</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nom complet"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="email@example.com"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(null)
                    setEditData({ name: '', email: '' })
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateUser(showEditModal)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour voir les détails */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Détails du compte</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                  <p className="text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rôle</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <div className="flex space-x-2">
                    {selectedUser.approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Approuvé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        En attente
                      </span>
                    )}
                    {selectedUser.suspended && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Suspendu
                      </span>
                    )}
                  </div>
                </div>
                {selectedUser.company && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entreprise</label>
                    <p className="text-sm text-gray-900">{selectedUser.company.name}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date de création</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedUser.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                {selectedUser.approvedAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date d'approbation</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedUser.approvedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
                {selectedUser.suspendedAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date de suspension</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedUser.suspendedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(null)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

