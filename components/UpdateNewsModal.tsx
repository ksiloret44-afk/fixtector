'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, CheckCircle, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function UpdateNewsModal() {
  const [show, setShow] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)

  useEffect(() => {
    // Vérifier la version actuelle et la dernière version vue
    const currentVersion = '1.1.3' // À mettre à jour à chaque release
    const lastSeenVersion = localStorage.getItem('lastSeenUpdateVersion')
    const dontShowAgain = localStorage.getItem('dontShowUpdateModal') === 'true'
    const dontShowVersion = localStorage.getItem('dontShowUpdateModalVersion')
    
    // Extraire la version majeure (ex: "1.1.2" -> "1.1")
    const getMajorVersion = (version: string) => {
      const parts = version.split('.')
      return `${parts[0]}.${parts[1] || '0'}`
    }
    
    const currentMajor = getMajorVersion(currentVersion)
    const lastSeenMajor = lastSeenVersion ? getMajorVersion(lastSeenVersion) : null
    const dontShowMajor = dontShowVersion ? getMajorVersion(dontShowVersion) : null
    
    // Afficher uniquement si :
    // 1. La version majeure a changé (nouvelle mise à jour majeure) ET
    // 2. Soit l'utilisateur n'a pas coché "Ne plus apparaître", soit la version majeure a changé depuis
    const shouldShow = 
      currentMajor !== lastSeenMajor && // Nouvelle version majeure
      (!dontShowAgain || currentMajor !== dontShowMajor) // Pas de "ne plus apparaître" OU nouvelle version majeure depuis
    
    if (shouldShow) {
      fetch('/api/updates/check')
        .then(res => res.json())
        .then(data => {
          if (data.currentVersion) {
            setUpdateInfo(data)
            setShow(true)
          }
        })
        .catch(err => console.error('Erreur:', err))
    }
  }, [])

  const handleClose = () => {
    setShow(false)
    if (updateInfo?.currentVersion) {
      localStorage.setItem('lastSeenUpdateVersion', updateInfo.currentVersion)
    }
  }

  const handleDontShowAgain = () => {
    setShow(false)
    if (updateInfo?.currentVersion) {
      localStorage.setItem('lastSeenUpdateVersion', updateInfo.currentVersion)
      localStorage.setItem('dontShowUpdateModal', 'true')
      localStorage.setItem('dontShowUpdateModalVersion', updateInfo.currentVersion)
    }
  }

  if (!show || !updateInfo) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
            <Sparkles className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nouveautés de FixTector
          </h2>
          <p className="text-gray-600">
            Version {updateInfo.currentVersion}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ce qui a été ajouté :</h3>
          {updateInfo.releaseNotes ? (
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: updateInfo.releaseNotes
                  .replace(/\n/g, '<br />')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }}
            />
          ) : (
            <div className="text-gray-700 space-y-2">
              <p className="font-semibold">✨ Nouvelles fonctionnalités :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Système d'essai gratuit de 24h avec blocage automatique</li>
                <li>Gestion des abonnements avec distinction actifs/essais</li>
                <li>Chatbot maison pour les administrateurs</li>
                <li>Système d'avis clients avec demande et approbation</li>
                <li>Fenêtre de nouveautés à chaque mise à jour majeure</li>
                <li>Intégration Stripe pour les paiements (en cours)</li>
              </ul>
              <p className="font-semibold mt-4">🔧 Améliorations :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Page d'administration améliorée avec statistiques</li>
                <li>Message de bienvenue pour les nouveaux utilisateurs en essai</li>
                <li>Interface de gestion des avis clients</li>
              </ul>
            </div>
          )}
        </div>

        {updateInfo.updateAvailable && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Une nouvelle version est disponible !
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Version {updateInfo.latestVersion} est disponible.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {updateInfo.releaseUrl && (
            <Link
              href={updateInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              onClick={handleClose}
            >
              Voir les détails
            </Link>
          )}
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Fermer
          </button>
          <button
            onClick={handleDontShowAgain}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Ne plus apparaître
          </button>
        </div>
      </div>
    </div>
  )
}

