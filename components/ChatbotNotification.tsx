'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'

interface CompanyChat {
  companyId: string
  companyName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface VisitorChat {
  visitorId: string
  visitorName: string
  firstName: string
  lastName: string
  email: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function ChatbotNotification() {
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationLink, setNotificationLink] = useState<string | null>(null)
  const previousCompanyChatsRef = useRef<CompanyChat[]>([])
  const previousVisitorChatsRef = useRef<VisitorChat[]>([])
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchCompanyChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chatbot/companies')
      const data = await response.json()
      if (response.ok && data.chats) {
        // Détecter les nouvelles conversations ou nouveaux messages
        if (previousCompanyChatsRef.current.length > 0) {
          // Comparer les dernières conversations pour détecter de nouveaux messages
          const previousLatest = previousCompanyChatsRef.current[0]
          const currentLatest = data.chats[0]
          
          if (currentLatest && previousLatest) {
            // Si le dernier message a changé et est récent (moins de 30 secondes)
            if (currentLatest.lastMessageTime !== previousLatest.lastMessageTime) {
              const messageTime = new Date(currentLatest.lastMessageTime).getTime()
              const now = Date.now()
              if (now - messageTime < 30000) {
                // Nouveau message détecté
                const message = `Nouveau message de ${currentLatest.companyName}`
                setNotificationMessage(message)
                setNotificationLink('/chatbot')
                setShowNotification(true)
                
                // Masquer la notification après 5 secondes
                if (notificationTimeoutRef.current) {
                  clearTimeout(notificationTimeoutRef.current)
                }
                notificationTimeoutRef.current = setTimeout(() => {
                  setShowNotification(false)
                }, 5000)
              }
            }
          }
        }
        
        previousCompanyChatsRef.current = data.chats
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des conversations d\'entreprise:', err)
    }
  }, [])

  const fetchVisitorChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chatbot/visitors')
      const data = await response.json()
      if (response.ok && data.chats) {
        // Détecter les nouvelles conversations ou nouveaux messages
        if (previousVisitorChatsRef.current.length > 0) {
          // Comparer les dernières conversations pour détecter de nouveaux messages
          const previousLatest = previousVisitorChatsRef.current[0]
          const currentLatest = data.chats[0]
          
          if (currentLatest && previousLatest) {
            // Si le dernier message a changé et est récent (moins de 30 secondes)
            if (currentLatest.lastMessageTime !== previousLatest.lastMessageTime) {
              const messageTime = new Date(currentLatest.lastMessageTime).getTime()
              const now = Date.now()
              if (now - messageTime < 30000) {
                // Nouveau message détecté
                const message = `Nouveau message de ${currentLatest.visitorName}`
                setNotificationMessage(message)
                setNotificationLink('/chatbot')
                setShowNotification(true)
                
                // Masquer la notification après 5 secondes
                if (notificationTimeoutRef.current) {
                  clearTimeout(notificationTimeoutRef.current)
                }
                notificationTimeoutRef.current = setTimeout(() => {
                  setShowNotification(false)
                }, 5000)
              }
            }
          }
        }
        
        previousVisitorChatsRef.current = data.chats
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des conversations de visiteur:', err)
    }
  }, [])

  // Polling pour vérifier les nouveaux messages toutes les 3 secondes (seulement pour les admins)
  useEffect(() => {
    if (!isAdmin) return

    // Charger les conversations initiales
    fetchCompanyChats()
    fetchVisitorChats()

    // Polling toutes les 3 secondes
    const interval = setInterval(() => {
      fetchCompanyChats()
      fetchVisitorChats()
    }, 3000)

    return () => {
      clearInterval(interval)
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [isAdmin, fetchCompanyChats, fetchVisitorChats])

  if (!isAdmin) return null

  return (
    <>
      {/* Notification toast en haut à droite */}
      {showNotification && (
        <div 
          className="fixed top-4 right-4 z-[10000]"
          style={{
            animation: 'slideInFromRight 0.4s ease-out',
            transform: 'translateX(0)',
            opacity: 1,
          }}
        >
          <div className="bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-900 px-4 py-3 rounded-lg shadow-2xl border-2 border-yellow-500 dark:border-yellow-400 flex items-center gap-3 min-w-[300px] max-w-[400px]">
            <Bell className="h-5 w-5 flex-shrink-0 animate-bounce text-yellow-900" />
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => {
                if (notificationLink) {
                  router.push(notificationLink)
                }
                setShowNotification(false)
                if (notificationTimeoutRef.current) {
                  clearTimeout(notificationTimeoutRef.current)
                }
              }}
            >
              <p className="text-sm font-bold">🔔 Nouveau message !</p>
              <p className="text-xs mt-1 font-medium">{notificationMessage}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowNotification(false)
                if (notificationTimeoutRef.current) {
                  clearTimeout(notificationTimeoutRef.current)
                }
              }}
              className="text-yellow-900 hover:text-yellow-800 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Style pour l'animation de la notification */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}} />
    </>
  )
}

