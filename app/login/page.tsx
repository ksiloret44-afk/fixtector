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
    setLoading(true)

    try {
      // Utiliser redirect: true pour que NextAuth gère correctement les cookies
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/',
      })
      
      // Si on arrive ici, c'est qu'il y a eu une erreur (car redirect: true devrait rediriger)
      console.log('Sign in result (ne devrait pas arriver ici):', result)
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
          <h1 className="text-3xl font-bold text-primary-700 mb-2">RPPHONE</h1>
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
          <p>Pas encore de compte ?</p>
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}

