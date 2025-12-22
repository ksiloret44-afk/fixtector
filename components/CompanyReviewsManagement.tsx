'use client'

import { useState, useEffect } from 'react'
import { Star, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CompanyReview {
  id: string
  companyName: string | null
  rating: number
  comment: string | null
  isPublic: boolean
  isApproved: boolean
  createdAt: string
  approvedAt: string | null
}

export default function CompanyReviewsManagement() {
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/company-reviews')
      const data = await response.json()
      if (response.ok) {
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, reviewId: string) => {
    try {
      const response = await fetch('/api/admin/company-reviews/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewId }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchReviews()
        alert(data.message || 'Action effectuée avec succès')
      } else {
        alert(data.error || 'Erreur lors de l\'action')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'action')
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

  const pendingReviews = reviews.filter(r => !r.isApproved)
  const approvedReviews = reviews.filter(r => r.isApproved && r.isPublic)
  const rejectedReviews = reviews.filter(r => !r.isPublic && r.isApproved === false)

  const filteredReviews = filter === 'pending'
    ? pendingReviews
    : filter === 'approved'
    ? approvedReviews
    : filter === 'rejected'
    ? rejectedReviews
    : reviews

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
              <Building2 className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{reviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingReviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Approuvés</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedReviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Refusés</p>
              <p className="text-2xl font-semibold text-gray-900">{rejectedReviews.length}</p>
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
            Tous ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({pendingReviews.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approuvés ({approvedReviews.length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'rejected'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refusés ({rejectedReviews.length})
          </button>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun avis</h3>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.isApproved && review.isPublic
                          ? 'bg-green-100 text-green-800'
                          : review.isApproved && !review.isPublic
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.isApproved && review.isPublic
                          ? 'Approuvé'
                          : review.isApproved && !review.isPublic
                          ? 'Refusé'
                          : 'En attente'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      {review.companyName || 'Entreprise anonyme'}
                    </p>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mb-3 italic">"{review.comment}"</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Soumis le {format(new Date(review.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      {review.approvedAt && (
                        <> • Approuvé le {format(new Date(review.approvedAt), 'dd MMM yyyy', { locale: fr })}</>
                      )}
                    </p>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    {!review.isApproved && (
                      <>
                        <button
                          onClick={() => handleAction('approve', review.id)}
                          className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleAction('reject', review.id)}
                          className="px-3 py-1 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {review.isApproved && review.isPublic && (
                      <button
                        onClick={() => handleAction('reject', review.id)}
                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                      >
                        Retirer
                      </button>
                    )}
                    {review.isApproved && !review.isPublic && (
                      <button
                        onClick={() => handleAction('approve', review.id)}
                        className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                      >
                        Réapprouver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

