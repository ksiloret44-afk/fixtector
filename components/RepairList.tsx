import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Wrench, Calendar, User } from 'lucide-react'

interface Repair {
  id: string
  ticketNumber: string
  deviceType: string
  brand: string
  model: string
  status: string
  estimatedCost: number | null
  finalCost: number | null
  createdAt: Date
  customer: {
    firstName: string
    lastName: string
    phone: string
  }
  user: {
    name: string
  }
}

export default function RepairList({ repairs }: { repairs: Repair[] }) {
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (repairs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Wrench className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune réparation</h3>
        <p className="mt-1 text-sm text-gray-500">
          Commencez par créer une nouvelle réparation.
        </p>
        <div className="mt-6">
          <Link
            href="/repairs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Nouvelle réparation
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {repairs.map((repair) => (
          <li key={repair.id}>
            <Link
              href={`/repairs/${repair.id}`}
              className="block hover:bg-gray-50 transition-colors"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Wrench className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-primary-600">
                          #{repair.ticketNumber.slice(0, 8)}
                        </p>
                        <span className="ml-2">
                          {getStatusBadge(repair.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {repair.deviceType} - {repair.brand} {repair.model}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {repair.customer.firstName} {repair.customer.lastName}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{repair.customer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm text-gray-500">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {format(new Date(repair.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </div>
                    {(repair.finalCost || repair.estimatedCost) && (
                      <div className="mt-2 text-sm font-medium text-gray-900">
                        {repair.finalCost
                          ? `${repair.finalCost.toFixed(2)} €`
                          : repair.estimatedCost
                          ? `~${repair.estimatedCost.toFixed(2)} €`
                          : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

