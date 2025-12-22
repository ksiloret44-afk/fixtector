'use client'

import { useState, useEffect } from 'react'
import { Star, Send, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClientReviewFormProps {
  customerId: string
}

export default function ClientReviewForm({ customerId }: ClientReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Veuillez sélectionner une note')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          rating,
          comment: comment.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/client')
        }, 2000)
      } else {
        setError(data.error || 'Erreur lors de l\'envoi de l\'avis')
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Erreur lors de l\'envoi de l\'avis')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre avis !</h2>
        <p className="text-gray-600">Votre avis a été enregistré et sera examiné par notre équipe.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Notez votre expérience
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {rating} {rating === 1 ? 'étoile' : 'étoiles'}
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Votre commentaire (optionnel)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Partagez votre expérience avec FixTector..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/client')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Envoi...' : 'Envoyer l\'avis'}
          </button>
        </div>
      </form>
    </div>
  )
}

