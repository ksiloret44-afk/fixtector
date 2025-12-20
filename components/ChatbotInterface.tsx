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
}

interface CompanyChat {
  companyId: string
  companyName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeChat, setActiveChat] = useState<'general' | string>('general')
  const [companyChats, setCompanyChats] = useState<CompanyChat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCompanyChats()
    if (activeChat === 'general') {
      fetchMessages()
    } else {
      fetchCompanyMessages(activeChat)
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

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chatbot/messages?general=true')
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
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input.trim(),
          companyId: activeChat !== 'general' ? activeChat : null,
          isGeneral: activeChat === 'general',
        }),
      })

      const data = await response.json()

      if (response.ok && data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString(),
          companyId: activeChat !== 'general' ? activeChat : null,
          isGeneral: activeChat === 'general',
        }
        setMessages(prev => [...prev, assistantMessage])
        if (activeChat !== 'general') {
          fetchCompanyChats() // Rafraîchir la liste
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
        companyId: activeChat !== 'general' ? activeChat : null,
        isGeneral: activeChat === 'general',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanyChats = companyChats.filter(chat =>
    chat.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white shadow rounded-lg flex" style={{ height: '700px' }}>
      {/* Sidebar gauche - Liste des entreprises */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
            <button
              onClick={() => setActiveChat('general')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
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
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Général
            </button>
            <button
              onClick={() => setActiveChat('companies')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
                activeChat !== 'general' && activeChat !== 'companies'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Entreprises
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {activeChat === 'general' ? (
            <div className="p-4">
              <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
                <h3 className="text-sm font-semibold text-primary-900 mb-2">
                  Page d'accueil - Demandes d'information
                </h3>
                <p className="text-xs text-primary-700">
                  Posez vos questions générales sur FixTector ici. Ces conversations sont publiques et accessibles à tous les administrateurs.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCompanyChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Aucune demande d'aide</p>
                </div>
              ) : (
                filteredCompanyChats.map((chat) => (
                  <button
                    key={chat.companyId}
                    onClick={() => setActiveChat(chat.companyId)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      activeChat === chat.companyId ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.companyName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
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
          )}
        </div>
      </div>

      {/* Zone centrale - Chat */}
      <div className="flex-1 flex flex-col">
        {/* En-tête du chat */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {activeChat === 'general' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Page d'accueil - Demandes d'information</h3>
              <p className="text-sm text-gray-500">Questions générales sur FixTector</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {companyChats.find(c => c.companyId === activeChat)?.companyName || 'Entreprise'}
              </h3>
              <p className="text-sm text-gray-500">Demande d'aide de l'entreprise</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">Commencez une conversation</p>
              <p className="text-sm mt-2">
                {activeChat === 'general' 
                  ? 'Posez vos questions générales sur FixTector'
                  : 'Échangez avec cette entreprise'}
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
                      : 'bg-gray-200'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg p-3 max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-primary-100'
                        : 'text-gray-500'
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
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeChat === 'general'
                  ? "Posez votre question sur FixTector..."
                  : "Répondez à la demande d'aide..."
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
      </div>
    </div>
  )
}
