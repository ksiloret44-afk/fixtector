'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react'

export default function HelpRequestWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || loading) return

    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/chatbot/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage('')
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 2000)
      } else {
        alert(data.error || 'Erreur lors de l\'envoi de la demande')
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'envoi de la demande')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        title="Demander de l'aide"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Demander de l'aide</h3>
          <p className="text-sm text-gray-500">Un administrateur vous répondra bientôt</p>
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setSuccess(false)
            setMessage('')
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {success ? (
        <div className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Demande envoyée !</p>
          <p className="text-sm text-gray-500 mt-2">
            Un administrateur vous répondra bientôt.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre problème ou votre question..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Envoi...' : 'Envoyer'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setMessage('')
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

