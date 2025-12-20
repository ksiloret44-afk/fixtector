'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react'
import Image from 'next/image'

interface Photo {
  id: string
  url: string
  filename: string
  type: string
  description?: string
  createdAt: Date
}

interface RepairPhotosProps {
  repairId: string
}

export default function RepairPhotos({ repairId }: RepairPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoType, setPhotoType] = useState('before')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchPhotos()
  }, [repairId])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repairs/${repairId}/photos`)
      const data = await response.json()
      setPhotos(data.photos || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Valider le type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image')
        return
      }
      // Valider la taille (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10MB)')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', photoType)
      if (description) {
        formData.append('description', description)
      }

      const response = await fetch(`/api/repairs/${repairId}/photos`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPhotos([data.photo, ...photos])
        setSelectedFile(null)
        setDescription('')
        setPhotoType('before')
        setShowUpload(false)
        alert('Photo uploadée avec succès')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de l\'upload')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return
    }

    try {
      const response = await fetch(`/api/repairs/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPhotos(photos.filter(p => p.id !== photoId))
        alert('Photo supprimée avec succès')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      before: 'Avant',
      after: 'Après',
      other: 'Autre',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      before: 'bg-blue-100 text-blue-800',
      after: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Chargement des photos...</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Photos de la réparation
        </h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Ajouter une photo
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de photo
              </label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="before">Avant réparation</option>
                <option value="after">Après réparation</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la photo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Upload en cours...' : 'Uploader'}
              </button>
              <button
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFile(null)
                  setDescription('')
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune photo</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez des photos pour documenter la réparation
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={photo.url}
                  alt={photo.description || photo.filename}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(photo.type)}`}>
                    {getTypeLabel(photo.type)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {photo.description && (
                <p className="mt-1 text-xs text-gray-600 truncate">{photo.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

