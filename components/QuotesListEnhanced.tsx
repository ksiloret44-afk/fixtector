'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock, Search, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import QuoteActionsMenu from './QuoteActionsMenu'

interface Quote {
  id: string
  quoteNumber: string
  status: string
  totalCost: number
  validUntil: string
  createdAt: string
  customer: {
    id: string
    firstName: string
    lastName: string
  }
  repair: {
    id: string
    ticketNumber: string
    deviceType: string
    brand: string
    model: string
  } | null
}

interface QuotesListEnhancedProps {
  initialQuotes: Quote[]
  initialStats: {
    total: number
    pending: number
    accepted: number
    rejected: number
  }
}

export default function QuotesListEnhanced({ initialQuotes, initialStats }: QuotesListEnhancedProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [stats, setStats] = useState(initialStats)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 20

  // Filtrer et trier les devis
  const filteredQuotes = quotes
    .filter(quote => {
      // Filtre de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          quote.quoteNumber.toLowerCase().includes(searchLower) ||
          `${quote.customer.firstName} ${quote.customer.lastName}`.toLowerCase().includes(searchLower) ||
          (quote.repair && `${quote.repair.deviceType} ${quote.repair.brand} ${quote.repair.model}`.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) return false
      }

      // Filtre de statut
      if (statusFilter !== 'all') {
        if (statusFilter === 'expired') {
          if (quote.status !== 'pending' || new Date(quote.validUntil) >= new Date()) return false
        } else if (quote.status !== statusFilter) {
          return false
        }
      }

      // Filtre de date
      if (dateFilter !== 'all') {
        const quoteDate = new Date(quote.createdAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dateFilter === 'today' && daysDiff !== 0) return false
        if (dateFilter === 'week' && daysDiff > 7) return false
        if (dateFilter === 'month' && daysDiff > 30) return false
        if (dateFilter === 'year' && daysDiff > 365) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'amount-desc':
          return b.totalCost - a.totalCost
        case 'amount-asc':
          return a.totalCost - b.totalCost
        case 'customer-asc':
          return `${a.customer.firstName} ${a.customer.lastName}`.localeCompare(`${b.customer.firstName} ${b.customer.lastName}`)
        default:
          return 0
      }
    })

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedQuotes = filteredQuotes.slice(startIndex, startIndex + itemsPerPage)

  const handleSelectAll = () => {
    if (selectedQuotes.size === paginatedQuotes.length) {
      setSelectedQuotes(new Set())
    } else {
      setSelectedQuotes(new Set(paginatedQuotes.map(q => q.id)))
    }
  }

  const handleSelectQuote = (quoteId: string) => {
    const newSelected = new Set(selectedQuotes)
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId)
    } else {
      newSelected.add(quoteId)
    }
    setSelectedQuotes(newSelected)
  }

  const handleExportSelected = async () => {
    if (selectedQuotes.size === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/quotes/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteIds: Array.from(selectedQuotes) }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `devis-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSelectedQuotes(new Set())
      }
    } catch (err) {
      console.error('Erreur lors de l\'export:', err)
      alert('Erreur lors de l\'export des devis')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (quote: Quote) => {
    const isExpired = quote.status === 'pending' && new Date(quote.validUntil) < new Date()
    
    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Expiré
        </span>
      )
    }

    switch (quote.status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepté
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Refusé
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client, appareil..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Filtre de statut */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="accepted">Acceptés</option>
              <option value="rejected">Refusés</option>
              <option value="expired">Expirés</option>
            </select>
          </div>

          {/* Filtre de date */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>

        {/* Tri et actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="date-desc">Plus récent</option>
              <option value="date-asc">Plus ancien</option>
              <option value="amount-desc">Montant décroissant</option>
              <option value="amount-asc">Montant croissant</option>
              <option value="customer-asc">Client (A-Z)</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredQuotes.length} devis trouvé{filteredQuotes.length > 1 ? 's' : ''}
            </span>
          </div>

          {selectedQuotes.size > 0 && (
            <button
              onClick={handleExportSelected}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter {selectedQuotes.size} devis
            </button>
          )}
        </div>
      </div>

      {/* Liste des devis */}
      {paginatedQuotes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Aucun devis trouvé</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Aucun devis ne correspond à vos critères de recherche.'
              : 'Commencez par créer votre premier devis depuis une réparation.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow overflow-visible sm:rounded-md">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedQuotes.size === paginatedQuotes.length && paginatedQuotes.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sélectionner tout</span>
              </label>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedQuotes.map((quote) => (
                <li key={quote.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={selectedQuotes.has(quote.id)}
                          onChange={() => handleSelectQuote(quote.id)}
                          className="mr-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Link href={`/quotes/${quote.id}`} className="flex items-center flex-1">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-primary-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {quote.customer.firstName} {quote.customer.lastName}
                              </p>
                              {getStatusBadge(quote)}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                              {quote.repair && (
                                <>
                                  <span>{quote.repair.deviceType} - {quote.repair.brand} {quote.repair.model}</span>
                                  <span className="mx-2">•</span>
                                </>
                              )}
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Créé le {format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                              <span className="mx-2">•</span>
                              <span>Valide jusqu'au {format(new Date(quote.validUntil), 'dd MMM yyyy', { locale: fr })}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <div className="ml-4 flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {(quote.totalCost * 1.2).toFixed(2)} € TTC
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            HT: {quote.totalCost.toFixed(2)} €
                          </p>
                        </div>
                        <QuoteActionsMenu
                          quoteId={quote.id}
                          status={quote.status}
                          repairId={quote.repair?.id}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

