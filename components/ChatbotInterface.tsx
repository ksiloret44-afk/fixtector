'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, Plus, Search, Building2, MessageSquare, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  companyId?: string | null
  isGeneral?: boolean
  metadata?: string | null
}

interface CompanyChat {
  companyId: string
  companyName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface VisitorChat {
  visitorId: string // email
  visitorName: string
  firstName: string
  lastName: string
  email: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeChat, setActiveChat] = useState<'general' | 'visitors' | 'companies' | string>('visitors')
  const [companyChats, setCompanyChats] = useState<CompanyChat[]>([])
  const [visitorChats, setVisitorChats] = useState<VisitorChat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCompanyChats()
    fetchVisitorChats()
    
    if (activeChat === 'visitors' || activeChat === 'companies') {
      // Ne rien faire, juste afficher la liste
      setMessages([])
    } else if (activeChat.startsWith('visitor:')) {
      // C'est un visiteur spécifique (format: visitor:email@example.com)
      const email = activeChat.replace('visitor:', '')
      fetchVisitorMessages(email)
    } else if (activeChat.startsWith('company:')) {
      // C'est un companyId spécifique (format: company:companyId)
      const companyId = activeChat.replace('company:', '')
      fetchCompanyMessages(companyId)
    } else {
      // Par défaut, ne rien afficher
      setMessages([])
    }
  }, [activeChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchCompanyChats = async () => {
    try {
      const response = await fetch('/api/chatbot/companies')
      const data = await response.json()
      if (response.ok && data.chats) {
        setCompanyChats(data.chats)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const fetchVisitorChats = async () => {
    try {
      const response = await fetch('/api/chatbot/visitors')
      const data = await response.json()
      if (response.ok && data.chats) {
        setVisitorChats(data.chats)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const fetchVisitorMessages = async (email: string) => {
    try {
      const response = await fetch(`/api/chatbot/messages?visitorEmail=${encodeURIComponent(email)}`)
      const data = await response.json()
      if (response.ok && data.messages) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const fetchCompanyMessages = async (companyId: string) => {
    try {
      const response = await fetch(`/api/chatbot/messages?companyId=${companyId}`)
      const data = await response.json()
      if (response.ok && data.messages) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
      companyId: activeChat !== 'general' ? activeChat : null,
      isGeneral: activeChat === 'general',
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const isVisitorChat = activeChat.startsWith('visitor:')
      const isCompanyChat = activeChat.startsWith('company:')
      const companyId = isCompanyChat ? activeChat.replace('company:', '') : null
      const visitorEmail = isVisitorChat ? activeChat.replace('visitor:', '') : null

      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input.trim(),
          companyId: companyId,
          visitorEmail: visitorEmail,
          isGeneral: isVisitorChat, // Les visiteurs sont des messages généraux
        }),
      })

      const data = await response.json()

      if (response.ok && data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString(),
          companyId: companyId,
          isGeneral: isVisitorChat,
        }
        setMessages(prev => [...prev, assistantMessage])
        if (isCompanyChat) {
          fetchCompanyChats() // Rafraîchir la liste
        } else if (isVisitorChat) {
          fetchVisitorChats() // Rafraîchir la liste des visiteurs
        }
      } else {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message')
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        createdAt: new Date().toISOString(),
        companyId: activeChat.startsWith('company:') ? activeChat.replace('company:', '') : null,
        isGeneral: activeChat.startsWith('visitor:'),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanyChats = companyChats.filter(chat =>
    chat.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredVisitorChats = visitorChats.filter(chat =>
    chat.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg flex" style={{ height: '700px' }}>
      {/* Sidebar gauche - Liste des entreprises */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
            <button
              onClick={() => setActiveChat('general')}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Nouvelle conversation générale"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {/* Onglets */}
          <div className="flex space-x-1 mb-3">
            <button
              onClick={() => setActiveChat('general')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
                activeChat === 'general'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Page d'accueil
            </button>
            <button
              onClick={() => {
                if (activeChat === 'general' || activeChat === 'companies') {
                  setActiveChat('companies')
                }
              }}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
                activeChat !== 'general' && activeChat !== 'companies'
                  ? 'bg-primary-600 text-white'
                  : activeChat === 'companies'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Entreprises
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {activeChat === 'visitors' ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVisitorChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm">Aucun visiteur</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Les visiteurs de la page d'accueil apparaîtront ici lorsqu'ils enverront des messages
                  </p>
                </div>
              ) : (
                filteredVisitorChats.map((chat) => (
                  <button
                    key={chat.visitorId}
                    onClick={() => setActiveChat(`visitor:${chat.email}`)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      activeChat === `visitor:${chat.email}` ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {chat.visitorName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {chat.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(chat.lastMessageTime), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                            {chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : activeChat === 'companies' ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCompanyChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm">Aucune demande d'aide d'entreprise</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Les entreprises enregistrées apparaîtront ici lorsqu'elles enverront des demandes d'aide
                  </p>
                </div>
              ) : (
                filteredCompanyChats.map((chat) => (
                  <button
                    key={chat.companyId}
                    onClick={() => setActiveChat(`company:${chat.companyId}`)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      activeChat === `company:${chat.companyId}` ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {chat.companyName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(chat.lastMessageTime), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                            {chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : activeChat.startsWith('visitor:') ? (
            <div className="p-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Visiteur sélectionné
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Conversation avec {visitorChats.find(v => `visitor:${v.email}` === activeChat)?.visitorName || 'ce visiteur'}
                </p>
              </div>
            </div>
          ) : activeChat.startsWith('company:') ? (
            <div className="p-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Entreprise sélectionnée
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Conversation avec {companyChats.find(c => `company:${c.companyId}` === activeChat)?.companyName || 'cette entreprise'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Zone centrale - Chat */}
      <div className="flex-1 flex flex-col">
        {/* En-tête du chat */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {activeChat === 'general' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Page d'accueil - Demandes d'information</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Messages des visiteurs de la page d'accueil (landing page)</p>
            </div>
          ) : activeChat === 'companies' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sélectionnez une entreprise</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choisissez une entreprise enregistrée pour voir ses demandes d'aide</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {companyChats.find(c => c.companyId === activeChat)?.companyName || 'Entreprise'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Demande d'aide de l'entreprise enregistrée</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {activeChat === 'visitors' || activeChat === 'companies' ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              {activeChat === 'visitors' ? (
                <>
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="font-medium">Sélectionnez un visiteur</p>
                  <p className="text-sm mt-2">
                    Cliquez sur un visiteur dans la liste de gauche pour voir sa conversation
                  </p>
                </>
              ) : (
                <>
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="font-medium">Sélectionnez une entreprise</p>
                  <p className="text-sm mt-2">
                    Cliquez sur une entreprise dans la liste de gauche pour voir ses demandes d'aide
                  </p>
                </>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="font-medium">Commencez une conversation</p>
              <p className="text-sm mt-2">
                {activeChat.startsWith('visitor:')
                  ? 'Échangez avec ce visiteur'
                  : activeChat.startsWith('company:')
                  ? 'Échangez avec cette entreprise enregistrée'
                  : 'Aucune conversation sélectionnée'}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-primary-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg p-3 max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Afficher les infos du visiteur pour les messages généraux */}
                  {message.role === 'user' && message.isGeneral && message.metadata && (() => {
                    try {
                      const metadata = JSON.parse(message.metadata)
                      if (metadata.firstName || metadata.lastName || metadata.email) {
                        return (
                          <div className={`mb-2 pb-2 border-b ${message.role === 'user' ? 'border-primary-400' : 'border-gray-200 dark:border-gray-700'}`}>
                            <p className={`text-xs font-medium ${message.role === 'user' ? 'text-primary-100' : 'text-gray-600 dark:text-gray-400'}`}>
                              {metadata.firstName && metadata.lastName 
                                ? `${metadata.firstName} ${metadata.lastName}`
                                : metadata.firstName || metadata.lastName || 'Visiteur'}
                              {metadata.email && (
                                <span className="ml-2 opacity-75">
                                  ({metadata.email})
                                </span>
                              )}
                            </p>
                          </div>
                        )
                      }
                    } catch (e) {
                      // Ignorer si metadata n'est pas un JSON valide
                    }
                    return null
                  })()}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-primary-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {format(new Date(message.createdAt), 'HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeChat === 'general'
                  ? "Répondez aux questions de la page d'accueil..."
                  : activeChat === 'companies'
                  ? "Sélectionnez une entreprise pour répondre..."
                  : "Répondez à la demande d'aide de l'entreprise..."
              }
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading || activeChat === 'companies'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || activeChat === 'companies'}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
