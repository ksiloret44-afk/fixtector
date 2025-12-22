'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const categories = [
  'Écran',
  'Batterie',
  'Clavier',
  'Carte mère',
  'Processeur',
  'Mémoire RAM',
  'Disque dur / SSD',
  'Carte graphique',
  'Alimentation',
  'Ventilateur',
  'Connecteur',
  'Housse / Coque',
  'Chargeur',
  'Câble',
  'Autre'
]

export default function NewPartForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    partNumber: '',
    category: '',
    stock: '0',
    unitPrice: '',
    supplier: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          brand: formData.brand || null,
          partNumber: formData.partNumber || null,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          supplier: formData.supplier || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        setLoading(false)
        return
      }

      router.push('/parts')
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors de la création de la pièce')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <Link
          href="/parts"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la pièce <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Écran iPhone 13 Pro"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Marque
              </label>
              <input
                id="brand"
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Apple, Samsung, etc."
              />
            </div>

            <div>
              <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Référence / Numéro de pièce
              </label>
              <input
                id="partNumber"
                type="text"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="REF-12345"
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock initial
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Prix unitaire (€) <span className="text-red-500">*</span>
              </label>
              <input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="29.99"
              />
            </div>

            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur
              </label>
              <input
                id="supplier"
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Description détaillée de la pièce..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link
              href="/parts"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la pièce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

