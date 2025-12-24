'use client'

import { useState } from 'react'
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function TestSMTPPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: 'Erreur lors du test',
        details: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full p-3">
              <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Test de configuration SMTP
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testez votre configuration SMTP en envoyant un email de test
          </p>
        </div>

        <form onSubmit={handleTest} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adresse email de test
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              placeholder="votre@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Test en cours...</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                <span>Envoyer un email de test</span>
              </>
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium mb-2 ${
                  result.success 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.success ? 'Succès !' : 'Erreur'}
                </h3>
                <p className={`text-sm mb-2 ${
                  result.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {result.message || result.error}
                </p>
                
                {result.config && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    <p className="font-semibold mb-2">Configuration SMTP:</p>
                    <ul className="space-y-1">
                      <li><strong>Host:</strong> {result.config.smtpHost}</li>
                      <li><strong>Port:</strong> {result.config.smtpPort}</li>
                      <li><strong>User:</strong> {result.config.smtpUser}</li>
                      <li><strong>Password:</strong> {result.config.smtpPassword}</li>
                      <li><strong>From:</strong> {result.config.smtpFrom}</li>
                      <li><strong>Configuré:</strong> {result.config.configured ? '✓ Oui' : '✗ Non'}</li>
                    </ul>
                  </div>
                )}

                {result.details && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    <p className="font-semibold mb-2">Détails de l'erreur:</p>
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}

                {result.messageId && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Message ID: {result.messageId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-semibold mb-2">Variables d'environnement requises:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">SMTP_HOST</code></li>
            <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">SMTP_PORT</code> (optionnel, défaut: 587)</li>
            <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">SMTP_USER</code></li>
            <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">SMTP_PASSWORD</code></li>
            <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">SMTP_FROM</code> (optionnel)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

