import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page non trouvée</p>
        <p className="mt-2 text-gray-500">
          La page que vous recherchez n'existe pas.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Home className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

