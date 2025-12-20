import { notFound } from 'next/navigation'
import { getCompanyPrismaById } from '@/lib/db-manager'
import { getMainPrisma } from '@/lib/db-manager'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Wrench, Clock, CheckCircle, XCircle, Package, FileText, Receipt, Camera } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function findRepairByToken(token: string) {
  // Chercher dans toutes les bases de données d'entreprise
  const mainPrisma = getMainPrisma()
  const companies = await mainPrisma.company.findMany()
  
  for (const company of companies) {
    try {
      const companyPrisma = getCompanyPrismaById(company.id)
      const repair = await companyPrisma.repair.findUnique({
        where: { trackingToken: token },
        include: {
          customer: true,
          parts: {
            include: {
              part: true,
            },
          },
          quote: true,
          invoice: true,
          photos: {
            where: { type: { in: ['before', 'after'] } },
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      
      if (repair) {
        return { repair, company }
      }
    } catch (error) {
      // Continuer avec la prochaine entreprise
      continue
    }
  }
  
  return null
}

export default async function TrackRepairPage({
  params,
}: {
  params: { token: string }
}) {
  // Chercher la réparation dans toutes les bases de données
  const result = await findRepairByToken(params.token)
  
  if (!result) {
    notFound()
  }
  
  const { repair, company } = result

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any; description: string }> = {
      pending: {
        label: 'En attente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        description: 'Votre appareil est en attente de prise en charge',
      },
      in_progress: {
        label: 'En cours de réparation',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Wrench,
        description: 'Votre appareil est actuellement en cours de réparation',
      },
      waiting_parts: {
        label: 'En attente de pièces',
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: Package,
        description: 'Nous attendons la réception des pièces nécessaires',
      },
      completed: {
        label: 'Réparation terminée',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        description: 'Votre réparation est terminée et prête à être récupérée',
      },
      cancelled: {
        label: 'Annulée',
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        description: 'Cette réparation a été annulée',
      },
    }

    return statusMap[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: Clock,
      description: 'Statut inconnu',
    }
  }

  const statusInfo = getStatusInfo(repair.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            {company.logoUrl && (
              <div className="flex justify-center mb-4">
                <img 
                  src={company.logoUrl} 
                  alt={company.name} 
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Suivi de votre réparation
            </h1>
            <p className="text-gray-600">
              Ticket #{repair.ticketNumber.slice(0, 8).toUpperCase()}
            </p>
            {company.name && (
              <p className="text-sm text-gray-500 mt-2">
                {company.name}
              </p>
            )}
          </div>

          {/* Statut principal */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-6 py-3 rounded-lg border-2 ${statusInfo.className} mb-3`}>
              <StatusIcon className="h-6 w-6 mr-3" />
              <span className="text-lg font-semibold">{statusInfo.label}</span>
            </div>
            <p className="text-gray-600 text-sm">{statusInfo.description}</p>
          </div>

          {/* Informations client */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="text-base font-medium text-gray-900">
                  {repair.customer.firstName} {repair.customer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="text-base font-medium text-gray-900">{repair.customer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de dépôt</p>
                <p className="text-base font-medium text-gray-900">
                  {format(new Date(repair.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              {repair.completedAt && (
                <div>
                  <p className="text-sm text-gray-600">Date de fin</p>
                  <p className="text-base font-medium text-gray-900">
                    {format(new Date(repair.completedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informations appareil */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-primary-600" />
            Appareil
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="text-base font-medium text-gray-900 capitalize">{repair.deviceType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Marque</p>
              <p className="text-base font-medium text-gray-900">{repair.brand}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Modèle</p>
              <p className="text-base font-medium text-gray-900">{repair.model}</p>
            </div>
            {repair.serialNumber && (
              <div>
                <p className="text-sm text-gray-600">Numéro de série</p>
                <p className="text-base font-medium text-gray-900">{repair.serialNumber}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Problème signalé</p>
            <p className="text-base text-gray-900 bg-gray-50 p-3 rounded">{repair.issue}</p>
          </div>
        </div>

        {/* Photos */}
        {repair.photos && repair.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-primary-600" />
              Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {repair.photos.map((photo: any) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Photo de la réparation'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {photo.type === 'before' && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Avant
                    </div>
                  )}
                  {photo.type === 'after' && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Après
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coûts */}
        {(repair.estimatedCost || repair.finalCost) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coûts</h2>
            <div className="space-y-3">
              {repair.estimatedCost && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Coût estimé</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {repair.estimatedCost.toFixed(2)} €
                  </span>
                </div>
              )}
              {repair.finalCost && (
                <div className="flex justify-between items-center p-3 bg-primary-50 rounded border-2 border-primary-200">
                  <span className="text-gray-700 font-medium">Coût final</span>
                  <span className="text-xl font-bold text-primary-600">
                    {repair.finalCost.toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        {(repair.quote || repair.invoice) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Documents
            </h2>
            <div className="space-y-3">
              {repair.quote && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="text-gray-700">Devis</span>
                  </div>
                  <a
                    href={`/api/quotes/${repair.quote.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Télécharger PDF
                  </a>
                </div>
              )}
              {repair.invoice && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="text-gray-700">Facture</span>
                  </div>
                  <a
                    href={`/api/invoices/${repair.invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Télécharger PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {repair.notes && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 bg-gray-50 p-4 rounded">{repair.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>Cette page se met à jour automatiquement</p>
          <p className="mt-2">
            Vous pouvez la consulter à tout moment avec ce lien
          </p>
        </div>
      </div>
    </div>
  )
}
