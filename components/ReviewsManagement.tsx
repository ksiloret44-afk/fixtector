'use client'

import { useState, useEffect } from 'react'
import { Star, CheckCircle, XCircle, Copy, Mail, ExternalLink, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Review {
  id: string
  rating: number
  comment: string | null
  customerName: string | null
  reviewToken: string
  submittedAt: string | null
  isApproved: boolean | null
  approvedAt: string | null
  rejectedAt: string | null
  repair: {
    deviceType: string
    brand: string
    model: string
    ticketNumber: string
  } | null
  customer: {
    firstName: string
    lastName: string
  }
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'submitted'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      const data = await response.json()
      console.log('[ReviewsManagement] Réponse API:', { ok: response.ok, reviewsCount: data.reviews?.length || 0, data })
      if (response.ok) {
        setReviews(data.reviews || [])
      } else {
        console.error('[ReviewsManagement] Erreur API:', data.error)
      }
    } catch (err) {
      console.error('[ReviewsManagement] Erreur:', err)
    } finally {
      setLoading(false)
    }
  }


  const copyReviewLink = (token: string) => {
    const baseUrl = window.location.origin
    const reviewUrl = `${baseUrl}/review/${token}`
    navigator.clipboard.writeText(reviewUrl)
    alert('Lien copié dans le presse-papier !')
  }

  const moderateReview = async (reviewId: string, action: 'approve' | 'reject') => {
    if (!confirm(action === 'approve' 
      ? 'Êtes-vous sûr de vouloir approuver cet avis ? Il sera visible publiquement.'
      : 'Êtes-vous sûr de vouloir rejeter cet avis ? Il ne sera pas visible publiquement.')) {
      return
    }

    setProcessingId(reviewId)
    try {
      const response = await fetch(`/api/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modération')
      }

      // Recharger les avis
      await fetchReviews()
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return review.rating === 0 || !review.submittedAt
    if (filter === 'submitted') return review.rating > 0 && review.submittedAt && review.isApproved === null
    if (filter === 'approved') return review.isApproved === true
    if (filter === 'rejected') return review.isApproved === false
    return true
  })

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
            Tous
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({reviews.filter(r => r.rating === 0).length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'submitted'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Soumis ({reviews.filter(r => r.rating > 0 && r.submittedAt).length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'submitted'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente de modération ({reviews.filter(r => r.rating > 0 && r.submittedAt && r.isApproved === null).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approuvés ({reviews.filter(r => r.isApproved === true).length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'rejected'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejetés ({reviews.filter(r => r.isApproved === false).length})
          </button>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Aucun avis</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'pending' && 'Aucune demande d\'avis en attente'}
              {filter === 'submitted' && 'Aucun avis soumis en attente de modération'}
              {filter === 'approved' && 'Aucun avis approuvé'}
              {filter === 'rejected' && 'Aucun avis rejeté'}
              {filter === 'all' && 'Commencez par demander un avis à vos clients'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredReviews.map((review) => (
              <li key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center">
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
                      {review.rating === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      )}
                      {review.rating > 0 && review.submittedAt && review.isApproved === null && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          En attente de modération
                        </span>
                      )}
                      {review.isApproved === true && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approuvé
                        </span>
                      )}
                      {review.isApproved === false && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeté
                        </span>
                      )}
                    </div>

                    {review.rating > 0 ? (
                      <>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                          <span className="font-medium">
                            {review.customerName || `${review.customer.firstName} ${review.customer.lastName}`}
                          </span>
                          {review.repair && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              - {review.repair.deviceType} {review.repair.brand} {review.repair.model}
                            </span>
                          )}
                        </p>
                        {review.comment && (
                          <p className="text-sm text-gray-700 mb-2 italic">"{review.comment}"</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p>
                            Soumis le {format(new Date(review.submittedAt!), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          {review.isApproved === true && review.approvedAt && (
                            <p className="text-green-600">
                              Approuvé le {format(new Date(review.approvedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                          {review.isApproved === false && review.rejectedAt && (
                            <p className="text-red-600">
                              Rejeté le {format(new Date(review.rejectedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                          <span className="font-medium">
                            {review.customer.firstName} {review.customer.lastName}
                          </span>
                          {review.repair && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              - {review.repair.deviceType} {review.repair.brand} {review.repair.model}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Avis créé - En attente de soumission
                        </p>
                        <button
                          onClick={() => copyReviewLink(review.reviewToken)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copier le lien
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {review.rating > 0 && review.submittedAt && (
                      <>
                        <a
                          href={`/review/${review.reviewToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Voir
                        </a>
                        {review.isApproved === null && (
                          <>
                            <button
                              onClick={() => moderateReview(review.id, 'approve')}
                              disabled={processingId === review.id}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                            >
                              {processingId === review.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Approuver
                            </button>
                            <button
                              onClick={() => moderateReview(review.id, 'reject')}
                              disabled={processingId === review.id}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                            >
                              {processingId === review.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Rejeter
                            </button>
                          </>
                        )}
                        {review.isApproved === true && (
                          <button
                            onClick={() => moderateReview(review.id, 'reject')}
                            disabled={processingId === review.id}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {processingId === review.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            Rejeter
                          </button>
                        )}
                        {review.isApproved === false && (
                          <button
                            onClick={() => moderateReview(review.id, 'approve')}
                            disabled={processingId === review.id}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                          >
                            {processingId === review.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Approuver
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

