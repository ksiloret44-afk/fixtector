'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TrialCountdown() {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [trialData, setTrialData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAndBlockAccess = async () => {
      try {
        const response = await fetch('/api/trial/check')
        const data = await response.json()
        
        if (data.trial?.hasTrial && !data.trial.isActive && !data.subscription?.isActive) {
          // L'essai est expiré et pas d'abonnement, rediriger vers la page de blocage
          router.push('/trial-blocked')
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    const fetchTrialStatus = async () => {
      try {
        const response = await fetch('/api/trial/check')
        const data = await response.json()
        
        // Vérifier si l'utilisateur a un abonnement actif
        if (data.subscription?.isActive) {
          setHasSubscription(true)
          // Ne pas afficher le compte à rebours si l'utilisateur a un abonnement actif
          return
        }
        
        if (data.trial?.hasTrial) {
          setTrialData(data.trial)
          
          if (data.trial.isActive && data.trial.expiresAt) {
            const updateCountdown = () => {
              const now = new Date().getTime()
              const expiresAt = new Date(data.trial.expiresAt).getTime()
              const difference = expiresAt - now

              if (difference <= 0) {
                setIsExpired(true)
                setTimeLeft('Expiré')
                // Vérifier et bloquer l'accès
                checkAndBlockAccess()
              } else {
                setIsExpired(false)
                const hours = Math.floor(difference / (1000 * 60 * 60))
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((difference % (1000 * 60)) / 1000)
                
                if (hours > 0) {
                  setTimeLeft(`${hours}h ${minutes}m`)
                } else if (minutes > 0) {
                  setTimeLeft(`${minutes}m ${seconds}s`)
                } else {
                  setTimeLeft(`${seconds}s`)
                }
              }
            }

            updateCountdown()
            const interval = setInterval(updateCountdown, 1000)

            return () => clearInterval(interval)
          } else {
            setIsExpired(true)
            setTimeLeft('Expiré')
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'essai:', err)
      }
    }

    fetchTrialStatus()
    const interval = setInterval(fetchTrialStatus, 60000) // Vérifier toutes les minutes

    return () => clearInterval(interval)
  }, [router])

  // Ne pas afficher si pas d'essai, si l'essai est expiré, ou si l'utilisateur a un abonnement actif
  if (!trialData || isExpired || hasSubscription) {
    return null
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
      <Clock className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        Essai: {timeLeft}
      </span>
    </div>
  )
}
