'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CreditCard, Clock } from 'lucide-react'
import Link from 'next/link'

export default function TrialBlocked() {
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trial/check')
      .then(res => res.json())
      .then(data => {
        if (data.expiresAt) {
          setExpiresAt(data.expiresAt)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Votre essai gratuit a expiré
        </h1>
        <p className="text-gray-600 mb-6">
          Votre période d'essai de 24h s'est terminée le{' '}
          {expiresAt && (
            <span className="font-semibold">{formatDate(expiresAt)}</span>
          )}
        </p>
        <p className="text-gray-700 mb-8">
          Pour continuer à utiliser FixTector et profiter de toutes nos fonctionnalités,
          veuillez vous abonner à notre service.
        </p>
        <div className="space-y-4">
          <Link
            href="/subscription"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Voir les abonnements
          </Link>
          <Link
            href="/logout"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Se déconnecter
          </Link>
        </div>
      </div>
    </div>
  )
}

