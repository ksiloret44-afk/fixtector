'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  User,
  Calendar,
  Coins,
  Package,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import RepairPhotos from './RepairPhotos'

interface RepairDetailsProps {
  repair: any
  isClient?: boolean // Si true, masquer les actions d'édition
}

export default function RepairDetails({ repair, isClient = false }: RepairDetailsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(repair.status)
  const [loading, setLoading] = useState(false)
  const [taxRate, setTaxRate] = useState(20.0)
  const [requestingReview, setRequestingReview] = useState(false)
  const [reviewUrl, setReviewUrl] = useState<string | null>(null)

  // Récupérer le taux de TVA depuis les paramètres
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.taxRate) {
          setTaxRate(parseFloat(data.settings.taxRate))
        }
      })
      .catch(err => console.error('Erreur:', err))
  }, [])

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStatus(newStatus)
        
        // Si on termine la réparation, créer/régénérer un devis
        if (newStatus === 'completed') {
          await createOrRegenerateQuote()
        }
        
        router.refresh()
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const requestReview = async () => {
    setRequestingReview(true)
    try {
      const response = await fetch('/api/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: repair.id,
          customerId: repair.customerId,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setReviewUrl(data.reviewUrl)
        // Copier le lien dans le presse-papier
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.reviewUrl)
          alert('Lien de demande d\'avis copié dans le presse-papier ! Vous pouvez l\'envoyer au client.')
        } else {
          alert(`Lien de demande d'avis : ${data.reviewUrl}`)
        }
      } else {
        alert(data.error || 'Erreur lors de la création de la demande d\'avis')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la création de la demande d\'avis')
    } finally {
      setRequestingReview(false)
    }
  }

  const createOrRegenerateQuote = async () => {
    try {
      // Vérifier si un devis existe déjà
      const existingQuote = repair.quote
      
      // Si un devis existe, le supprimer d'abord
      if (existingQuote) {
        await fetch(`/api/quotes/${existingQuote.id}`, {
          method: 'DELETE',
        })
      }

      // Calculer le coût des pièces
      const partsCost = repair.parts?.reduce((sum: number, rp: any) => {
        return sum + (rp.unitPrice * rp.quantity)
      }, 0) || 0

      // Utiliser le coût final si disponible, sinon le coût estimé
      const laborCost = repair.finalCost || repair.estimatedCost || 0
      const totalCost = laborCost + partsCost

      // Date de validité : 30 jours à partir d'aujourd'hui
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30)

      // Créer le nouveau devis
      const quoteResponse = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: repair.id,
          customerId: repair.customerId,
          userId: repair.userId,
          laborCost: laborCost,
          partsCost: partsCost,
          totalCost: totalCost,
          validUntil: validUntil.toISOString().split('T')[0],
          notes: repair.notes || null,
        }),
      })

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json()
        // Rediriger vers le nouveau devis
        router.push(`/quotes/${quoteData.quote.id}`)
      } else {
        const errorData = await quoteResponse.json()
        console.error('Erreur lors de la création du devis:', errorData)
        alert('Erreur lors de la création du devis: ' + (errorData.error || 'Une erreur est survenue'))
      }
    } catch (err) {
      console.error('Erreur lors de la création du devis:', err)
      alert('Erreur lors de la création du devis')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      waiting_parts: { label: 'En attente de pièces', className: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    }

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Réparation #{repair.ticketNumber.slice(0, 8)}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Créée le {format(new Date(repair.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(status)}
            {!isClient && (
              <Link
                href={`/repairs/${repair.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            )}
          </div>
        </div>

        {/* Actions rapides - uniquement pour les admins/users */}
        {!isClient && (
          <div className="flex flex-wrap gap-2 mt-4">
            {status !== 'in_progress' && status !== 'completed' && (
              <button
                onClick={() => updateStatus('in_progress')}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Démarrer
              </button>
            )}
            {status === 'in_progress' && (
              <button
                onClick={() => updateStatus('completed')}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer
              </button>
            )}
            {status !== 'cancelled' && (
              <button
                onClick={() => updateStatus('cancelled')}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler
              </button>
            )}
            {status === 'completed' && (
              <button
                onClick={requestReview}
                disabled={requestingReview}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <Star className="h-4 w-4 mr-2" />
                {requestingReview ? 'Génération...' : 'Demander un avis'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations client */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              Client
            </h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Nom:</span>{' '}
                <span className="text-gray-900">
                  {repair.customer.firstName} {repair.customer.lastName}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Téléphone:</span>{' '}
                <span className="text-gray-900">{repair.customer.phone}</span>
              </p>
              {repair.customer.email && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Email:</span>{' '}
                  <span className="text-gray-900">{repair.customer.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Informations appareil */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-gray-400" />
              Appareil
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-900 capitalize">{repair.deviceType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Marque</p>
                <p className="text-sm text-gray-900">{repair.brand}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Modèle</p>
                <p className="text-sm text-gray-900">{repair.model}</p>
              </div>
              {repair.serialNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Numéro de série</p>
                  <p className="text-sm text-gray-900">{repair.serialNumber}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Problème</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{repair.issue}</p>
            </div>
          </div>

          {/* Photos */}
          {!isClient && <RepairPhotos repairId={repair.id} />}

          {/* Notes */}
          {(repair.notes || repair.internalNotes) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              {repair.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes client</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{repair.notes}</p>
                </div>
              )}
              {repair.internalNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Notes internes</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{repair.internalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Pièces détachées */}
          {repair.parts && repair.parts.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-gray-400" />
                Pièces utilisées
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pièce</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {repair.parts.map((repairPart: any) => (
                      <tr key={repairPart.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{repairPart.part.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{repairPart.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{repairPart.unitPrice.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {(repairPart.quantity * repairPart.unitPrice).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Coûts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Coins className="h-5 w-5 mr-2 text-gray-400" />
              Coûts
            </h2>
            <div className="space-y-4">
              {repair.estimatedCost && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Coût estimé</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500 mb-1">HT</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {repair.estimatedCost.toFixed(2)} €
                      </p>
                    </div>
                    <div className="bg-primary-50 p-2 rounded">
                      <p className="text-xs text-gray-500 mb-1">TTC</p>
                      <p className="text-sm font-bold text-primary-600">
                        {taxRate === 0 ? repair.estimatedCost.toFixed(2) : (repair.estimatedCost * (1 + taxRate / 100)).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {repair.finalCost && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Coût final</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500 mb-1">HT</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {repair.finalCost.toFixed(2)} €
                      </p>
                    </div>
                    <div className="bg-primary-50 p-2 rounded">
                      <p className="text-xs text-gray-500 mb-1">TTC</p>
                      <p className="text-sm font-bold text-primary-600">
                        {taxRate === 0 ? repair.finalCost.toFixed(2) : (repair.finalCost * (1 + taxRate / 100)).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {repair.estimatedTime && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Durée estimée</p>
                  <p className="text-sm font-medium text-gray-900">{repair.estimatedTime}</p>
                </div>
              )}
            </div>
          </div>

          {/* Devis et factures */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Documents
            </h2>
            <div className="space-y-3">
              {repair.quote ? (
                <Link
                  href={`/quotes/${repair.quote.id}`}
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Voir le devis
                </Link>
              ) : (
                <Link
                  href={`/quotes/new?repairId=${repair.id}`}
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Créer un devis
                </Link>
              )}
              {repair.invoice ? (
                <Link
                  href={`/invoices/${repair.invoice.id}`}
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Voir la facture
                </Link>
              ) : repair.status === 'completed' && (
                <Link
                  href={`/invoices/new?repairId=${repair.id}`}
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Créer une facture
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

