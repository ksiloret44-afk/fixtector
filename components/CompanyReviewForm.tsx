'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CompanyReviewForm() {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasExistingReview, setHasExistingReview] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà laissé un avis
    fetch('/api/reviews/company/check')
      .then(res => res.json())
      .then(data => {
        if (data.review) {
          setHasExistingReview(true)
          setRating(data.review.rating)
          setComment(data.review.comment || '')
        }
      })
      .catch(err => console.error('Erreur:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (rating === 0) {
      setError('Veuillez donner une note en étoiles.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reviews/company/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue lors de l\'envoi de votre avis.')
        return
      }

      setSuccess(data.message || 'Votre avis a été enregistré et sera examiné par notre équipe avant publication.')
      setHasExistingReview(true)
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de l\'avis:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de votre avis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
      {hasExistingReview && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
          <p className="font-medium">Vous avez déjà laissé un avis.</p>
          <p className="text-sm mt-1">Vous pouvez le modifier ci-dessous. Il sera soumis à nouveau pour validation.</p>
        </div>
      )}

      <p className="text-gray-700 mb-4">
        Nous apprécions vos commentaires ! Veuillez laisser une note et un commentaire sur votre expérience avec FixTector.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Votre avis sera soumis à validation avant d'être affiché publiquement sur notre site.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre note</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer ${
                  star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
            placeholder="Partagez vos impressions sur FixTector..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Star className="h-5 w-5 mr-2" />
          )}
          {loading ? 'Envoi en cours...' : hasExistingReview ? 'Modifier mon avis' : 'Envoyer mon avis'}
        </button>
      </form>
    </div>
  )
}

