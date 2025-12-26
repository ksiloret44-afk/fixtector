'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [step, setStep] = useState<'login' | '2fa' | 'backup-code'>('login')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingMessage, setPendingMessage] = useState(searchParams?.get('pending') === 'true')
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(searchParams?.get('passwordReset') === 'success')

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPendingMessage(false)
    setLoading(true)

    try {
      // Envoyer le code 2FA
      const response = await fetch('/api/auth/send-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'COMPTE_SUSPENDU') {
          setError('Votre compte a été suspendu. Veuillez contacter l\'administrateur.')
          setLoading(false)
          return
        }
        if (data.error === 'Compte en attente d\'approbation') {
          setPendingMessage(true)
          setError('')
          setLoading(false)
          return
        }
        setError(data.error || 'Erreur lors de l\'envoi du code de vérification')
        setLoading(false)
        return
      }

      // Code envoyé, passer à l'étape 2FA
      setStep('2fa')
      setLoading(false)
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du code 2FA:', err)
      setError(`Erreur: ${err.message || 'Une erreur est survenue'}`)
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let response
      let data

      if (useBackupCode) {
        // Vérifier le code de secours
        response = await fetch('/api/auth/backup-codes/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: twoFactorCode }),
        })
        data = await response.json()
      } else {
        // Vérifier le code 2FA
        response = await fetch('/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: twoFactorCode }),
        })
        data = await response.json()
      }

      if (!response.ok) {
        setError(data.error || 'Code incorrect')
        setLoading(false)
        return
      }

      // Code valide, connecter l'utilisateur avec NextAuth
      // On utilise le userId comme token 2FA pour bypass la vérification du mot de passe
      const result = await signIn('credentials', {
        email,
        twoFactorToken: data.user.id, // Utiliser l'ID utilisateur comme token 2FA
        redirect: false,
        callbackUrl: '/',
      })

      if (result?.error) {
        setError('Erreur lors de la connexion. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // Connexion réussie
      await getSession()
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Erreur lors de la vérification du code:', err)
      setError(`Erreur: ${err.message || 'Une erreur est survenue'}`)
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setStep('login')
    setTwoFactorCode('')
    setError('')
    setUseBackupCode(false)
  }

  const handleUseBackupCode = () => {
    setUseBackupCode(true)
    setTwoFactorCode('')
    setError('')
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

        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
          {passwordResetSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              <p className="font-medium">Mot de passe réinitialisé avec succès !</p>
              <p className="text-sm mt-1">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            </div>
          )}
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
              {loading ? 'Envoi du code...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            {!useBackupCode ? (
              <>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                  <p className="font-medium">Code de vérification envoyé</p>
                  <p className="text-sm mt-1">Un code à 6 chiffres a été envoyé à <strong>{email}</strong>. Entrez-le ci-dessous pour compléter votre connexion.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Code de vérification
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setTwoFactorCode(value)
                    }}
                    required
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Vérification...' : 'Vérifier le code'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleUseBackupCode}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Utiliser un code de secours
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                  <p className="font-medium">Code de secours</p>
                  <p className="text-sm mt-1">Entrez l'un de vos codes de secours à 8 caractères pour vous connecter.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="backup-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Code de secours
                  </label>
                  <input
                    id="backup-code"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8)
                      setTwoFactorCode(value)
                    }}
                    required
                    maxLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white text-center text-xl tracking-wider font-mono"
                    placeholder="XXXXXXXX"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 8}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Vérification...' : 'Vérifier le code de secours'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(false)
                      setTwoFactorCode('')
                      setError('')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Utiliser le code email
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              ← Retour à la connexion
            </button>
          </form>
        )}

        <div className="mt-6 space-y-3 text-center text-sm text-gray-600">
          <div>
            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
              Mot de passe oublié ?
            </Link>
          </div>
          <div>
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Commencer l'essai gratuit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
