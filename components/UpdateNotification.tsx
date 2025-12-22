'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, X, Download } from 'lucide-react'

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Vérifier si la notification a été masquée dans le localStorage
    const dismissedVersion = localStorage.getItem('updateNotificationDismissed')
    
    // Vérifier les mises à jour toutes les 5 minutes
    const checkUpdates = () => {
      fetch('/api/updates/check')
        .then(res => res.json())
        .then(data => {
          if (data.updateAvailable && dismissedVersion !== data.latestVersion) {
            setUpdateAvailable(true)
            setLatestVersion(data.latestVersion)
          }
        })
        .catch(err => console.error('Erreur vérification mise à jour:', err))
    }
    
    // Vérifier immédiatement
    checkUpdates()
    
    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkUpdates, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('updateNotificationDismissed', latestVersion)
  }

  if (!updateAvailable || dismissed) {
    return null
  }

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-orange-400 mr-3 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">
            Une nouvelle version est disponible !
          </p>
          <p className="text-sm text-orange-700 mt-1">
            Version {latestVersion} est disponible. 
            <Link href="/updates" className="underline ml-1 font-medium">
              Vérifier les mises à jour
            </Link>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-orange-400 hover:text-orange-600"
          aria-label="Masquer la notification"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

