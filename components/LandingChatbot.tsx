'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const WELCOME_MESSAGE = "Bonjour ! Comment puis-je vous aider aujourd'hui avec FixTector ?"
const AUTO_RESPONSE_MESSAGE = "Merci pour votre question ! Un administrateur vous répondra bientôt. En attendant, vous pouvez découvrir toutes les fonctionnalités de FixTector sur cette page ou démarrer votre essai gratuit."

export default function LandingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [showUserForm, setShowUserForm] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousMessagesRef = useRef<Message[]>([])

  // Charger les infos utilisateur depuis localStorage
  useEffect(() => {
    if (!isOpen) return
    
    const savedInfo = localStorage.getItem('landingChatbotUserInfo')
    if (savedInfo) {
      try {
        const info = JSON.parse(savedInfo)
        if (info.firstName?.trim() && info.lastName?.trim() && info.email?.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (emailRegex.test(info.email)) {
            setUserInfo({
              firstName: info.firstName.trim(),
              lastName: info.lastName.trim(),
              email: info.email.trim(),
            })
            setShowUserForm(false)
          }
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    }
  }, [isOpen])

  // Charger les messages depuis le serveur
  const loadMessages = useCallback(async () => {
    if (!userInfo.email || showUserForm) return

    try {
      const response = await fetch(`/api/chatbot/landing/messages?email=${encodeURIComponent(userInfo.email)}`)
      const data = await response.json()
      
      if (response.ok && data.messages) {
        const serverMessages: Message[] = data.messages.map((msg: any) => {
          // S'assurer que le rôle est correct
          const role = msg.role === 'user' ? 'user' : 'assistant'
          return {
            id: msg.id,
            role: role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }
        })

        // Filtrer les doublons et organiser les messages
        const processedMessages = processMessages(serverMessages)
        
        // Détecter si la session a été réinitialisée (fermée depuis l'admin)
        // Si on avait des messages utilisateur avant et qu'il n'y en a plus maintenant,
        // cela signifie que la session a été réinitialisée depuis l'admin
        const hadUserMessages = previousMessagesRef.current.some(m => m.role === 'user')
        const hasUserMessagesNow = processedMessages.some(m => m.role === 'user')
        
        // Si on avait des messages utilisateur avant et qu'il n'y en a plus maintenant,
        // cela signifie que la session a été réinitialisée depuis l'admin
        if (hadUserMessages && !hasUserMessagesNow) {
          // Réinitialiser complètement la session
          localStorage.removeItem('landingChatbotUserInfo')
          setUserInfo({ firstName: '', lastName: '', email: '' })
          setShowUserForm(true)
          setMessages([])
          setInput('')
          previousMessagesRef.current = []
          return
        }
        
        // Mettre à jour la référence des messages précédents
        previousMessagesRef.current = processedMessages
        setMessages(processedMessages)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }, [userInfo.email, showUserForm])

  // Traiter les messages : ajouter le message de bienvenue et filtrer les doublons
  const processMessages = (serverMessages: Message[]): Message[] => {
    const result: Message[] = []
    let welcomeMessage: Message | null = null
    let hasAutoResponse = false
    const seenIds = new Set<string>()

    // Chercher le message de bienvenue dans les messages du serveur
    const welcomeInServer = serverMessages.find(m => m.content === WELCOME_MESSAGE)
    if (welcomeInServer) {
      welcomeMessage = welcomeInServer
    } else {
      // Créer le message de bienvenue avec un timestamp très ancien pour qu'il reste en premier
      welcomeMessage = {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date(0), // Timestamp très ancien pour rester en premier
      }
    }

    // Traiter les messages du serveur (sauf le message de bienvenue qui sera ajouté en premier)
    for (const msg of serverMessages) {
      // Éviter les doublons
      if (seenIds.has(msg.id)) continue
      seenIds.add(msg.id)

      // Ignorer le message de bienvenue s'il est dans le serveur (on l'ajoutera en premier)
      if (msg.content === WELCOME_MESSAGE) {
        continue
      }

      if (msg.role === 'user') {
        // Toujours ajouter les messages utilisateur
        result.push(msg)
      } else if (msg.role === 'assistant') {
        // Gérer les messages automatiques
        if (msg.content === AUTO_RESPONSE_MESSAGE) {
          if (!hasAutoResponse) {
            result.push(msg)
            hasAutoResponse = true
          }
        } else {
          // Messages de l'admin ou autres
          result.push(msg)
        }
      }
    }

    // Trier les messages (sauf le message de bienvenue) par timestamp
    result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Ajouter le message de bienvenue en premier
    return [welcomeMessage, ...result]
  }

  // Charger les messages quand le formulaire est validé
  useEffect(() => {
    if (isOpen && !showUserForm && userInfo.email) {
      loadMessages()
    }
  }, [isOpen, showUserForm, userInfo.email, loadMessages])

  // Polling pour récupérer les nouveaux messages
  useEffect(() => {
    if (!isOpen || showUserForm || !userInfo.email) return

    const interval = setInterval(() => {
      loadMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [isOpen, showUserForm, userInfo.email, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleClose = () => {
    if (messages.length > 0) {
      if (confirm('Voulez-vous vraiment fermer le chatbot ? Tous les messages seront effacés.')) {
        setMessages([])
        setInput('')
        setLoading(false)
        localStorage.removeItem('landingChatbotMessages')
        setIsOpen(false)
      }
    } else {
      setIsOpen(false)
    }
  }

  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const cleanedInfo = {
      firstName: userInfo.firstName.trim(),
      lastName: userInfo.lastName.trim(),
      email: userInfo.email.trim(),
    }
    
    if (!cleanedInfo.firstName || !cleanedInfo.lastName || !cleanedInfo.email) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanedInfo.email)) {
      alert('Veuillez entrer une adresse email valide')
      return
    }
    
    localStorage.setItem('landingChatbotUserInfo', JSON.stringify(cleanedInfo))
    setUserInfo(cleanedInfo)
    setShowUserForm(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    if (showUserForm || !userInfo.firstName || !userInfo.lastName || !userInfo.email) {
      alert('Veuillez d\'abord remplir vos informations')
      setShowUserForm(true)
      return
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chatbot/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          email: userInfo.email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Si c'est le premier message, ajouter la réponse automatique
        if (data.response) {
          const assistantMessage: Message = {
            id: `temp-${Date.now() + 1}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        }
        
        // Recharger depuis le serveur après un court délai
        setTimeout(() => {
          loadMessages()
        }, 500)
      } else {
        throw new Error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        title="Poser une question"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Questions sur FixTector ?</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors"
          title="Fermer le chatbot"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showUserForm ? (
          <div className="space-y-4">
            <div className="text-center text-gray-500 mb-4">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium">Bonjour !</p>
              <p className="text-sm mt-2">Avant de commencer, merci de nous indiquer vos coordonnées.</p>
            </div>
            <form onSubmit={handleUserInfoSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.firstName}
                  onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.lastName}
                  onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
              >
                Continuer
              </button>
            </form>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium">Bonjour {userInfo.firstName} !</p>
            <p className="text-sm mt-2">Posez vos questions sur FixTector, nous vous répondrons rapidement.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="flex items-start">
                  {message.role === 'assistant' && (
                    <Bot className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!showUserForm && (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
