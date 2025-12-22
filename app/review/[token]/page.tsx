'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2, CheckCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [repair, setRepair] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      fetch(`/api/reviews/repair/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.repair) {
            setRepair(data.repair)
            if (data.review && data.review.rating > 0) {
              setRating(data.review.rating)
              setComment(data.review.comment || '')
            }
          } else {
            setError('Avis non trouvé ou lien invalide')
          }
        })
        .catch(err => {
          console.error('Erreur:', err)
          setError('Erreur lors du chargement')
        })
        .finally(() => setLoading(false))
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (rating === 0) {
      setError('Veuillez donner une note en étoiles')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/reviews/repair/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error && !repair) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Merci pour votre avis !
          </h1>
          <p className="text-gray-600">
            Votre avis a été enregistré avec succès.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Partagez votre expérience
          </h1>
          {repair && (
            <p className="text-gray-600">
              Votre réparation #{repair.ticketNumber} - {repair.deviceType} {repair.brand} {repair.model}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre note
            </label>
            <div className="flex space-x-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-10 w-10 cursor-pointer transition-colors ${
                    star <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Votre commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Partagez vos impressions..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Star className="h-5 w-5 mr-2" />
                Envoyer mon avis
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
