'use client'

import { useState, useEffect } from 'react'
import { X, Clock, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TrialWelcome() {
  const [show, setShow] = useState(false)
  const [trialData, setTrialData] = useState<any>(null)

  useEffect(() => {
    // Vérifier si le message a déjà été affiché dans cette session
    const alreadyShown = sessionStorage.getItem('trialWelcomeShown')
    
    if (alreadyShown === 'true') {
      return // Ne pas afficher si déjà affiché dans cette session
    }

    // Afficher le message uniquement lors de la première visite de la session
    fetch('/api/trial/check')
      .then(res => res.json())
      .then(data => {
        if (data.trial?.hasTrial && data.trial?.isActive) {
          setTrialData(data.trial)
          setShow(true)
          // Marquer comme affiché dans cette session
          sessionStorage.setItem('trialWelcomeShown', 'true')
        }
      })
      .catch(err => console.error('Erreur:', err))
  }, [])

  const handleClose = () => {
    setShow(false)
    // Ne plus utiliser localStorage pour permettre l'affichage à chaque connexion
  }

  if (!show || !trialData) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue sur FixTector !
          </h2>
          <p className="text-gray-600">
            Vous bénéficiez d'un essai gratuit de 24h
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Votre essai expire le {formatDate(trialData.expiresAt)}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Vous pouvez à tout moment arrêter l'essai ou prendre un abonnement pour continuer à utiliser FixTector.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/subscription"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            onClick={handleClose}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Voir les abonnements
          </Link>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Commencer l'essai
          </button>
        </div>
      </div>
    </div>
  )
}

