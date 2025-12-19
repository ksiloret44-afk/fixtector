'use client'

import { useState } from 'react'
import { Bell, Database, Globe, Shield } from 'lucide-react'

export default function SettingsForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setSuccess('')
    
    // Simuler une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setSuccess('Paramètres enregistrés avec succès')
    setLoading(false)
    
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications par email</p>
              <p className="text-sm text-gray-500">Recevoir des emails pour les nouvelles réparations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications de rappel</p>
              <p className="text-sm text-gray-500">Rappels pour les réparations en attente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Préférences */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Globe className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Préférences</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Langue
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuseau horaire
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white">
              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Base de données */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Base de données</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Type de base de données: <span className="font-medium">SQLite</span>
            </p>
            <p className="text-sm text-gray-500">
              La base de données est stockée localement dans le fichier dev.db
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => window.open('/api/db/backup', '_blank')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Sauvegarder la base de données
            </button>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Sécurité</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Authentification: <span className="font-medium">NextAuth.js</span>
            </p>
            <p className="text-sm text-gray-500">
              Les mots de passe sont cryptés avec bcrypt
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  )
}

