'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingMessage, setPendingMessage] = useState(searchParams?.get('pending') === 'true')

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPendingMessage(false)
    setLoading(true)

    try {
      // Utiliser redirect: false pour gérer les erreurs manuellement
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/',
      })
      
      if (result?.error) {
        // Vérifier le type d'erreur
        if (result.error === 'COMPTE_SUSPENDU') {
          setError('Votre compte a été suspendu. Veuillez contacter l\'administrateur.')
          setLoading(false)
          return
        }
        
        // Si la connexion échoue, vérifier le statut d'approbation
        try {
          const statusResponse = await fetch('/api/auth/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.suspended) {
              setError('Votre compte a été suspendu. Veuillez contacter l\'administrateur.')
            } else if (!statusData.approved) {
              // Le compte existe mais n'est pas approuvé
              setPendingMessage(true)
              setError('')
            } else {
              // Le compte est approuvé mais les identifiants sont incorrects
              setError('Email ou mot de passe incorrect')
            }
          } else {
            // Utilisateur non trouvé ou autre erreur
            setError('Email ou mot de passe incorrect')
          }
        } catch (statusErr) {
          // Erreur lors de la vérification du statut
          setError('Email ou mot de passe incorrect')
        }
        setLoading(false)
      } else if (result?.ok) {
        // Connexion réussie, rediriger
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Sign in exception:', err)
      // Si l'erreur contient "NEXT_REDIRECT", c'est normal (c'est NextAuth qui redirige)
      if (err.message && err.message.includes('NEXT_REDIRECT')) {
        // C'est normal, NextAuth redirige
        return
      }
      setError(`Erreur: ${err.message || 'Une erreur est survenue'}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="FixTector" className="h-16" />
          </div>
          <p className="text-gray-600">Gestion de réparations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {pendingMessage && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <p className="font-medium">Compte en attente d'approbation</p>
              <p className="text-sm mt-1">Votre compte a été créé mais nécessite l'approbation d'un administrateur avant de pouvoir vous connecter.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Commencer l'essai gratuit
          </Link>
        </div>
      </div>
    </div>
  )
}

