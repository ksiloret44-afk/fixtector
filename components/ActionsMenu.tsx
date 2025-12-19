'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, FileText, Download, Edit, Trash2, CheckCircle, XCircle, Copy, Receipt } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ActionsMenuProps {
  type: 'quote' | 'invoice'
  id: string
  status?: string
  repairId?: string
}

export default function ActionsMenu({ type, id, status, repairId }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDownload = () => {
    // TODO: Implémenter le téléchargement PDF
    alert('Téléchargement PDF à venir')
    setIsOpen(false)
  }

  const handleView = () => {
    router.push(`/${type === 'quote' ? 'quotes' : 'invoices'}/${id}`)
    setIsOpen(false)
  }

  const handleEdit = () => {
    router.push(`/${type === 'quote' ? 'quotes' : 'invoices'}/${id}/edit`)
    setIsOpen(false)
  }

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce ${type === 'quote' ? 'devis' : 'facture'} ?`)) {
      try {
        const response = await fetch(`/api/${type === 'quote' ? 'quotes' : 'invoices'}/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          router.refresh()
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }
    setIsOpen(false)
  }

  const handleConvert = async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.invoice) {
          router.push(`/invoices/${data.invoice.id}`)
        } else {
          router.refresh()
        }
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
    setIsOpen(false)
  }

  const handleMarkAsPaid = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        type="button"
        aria-label="Menu d'actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[99]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 z-[100] border border-gray-200 overflow-hidden">
            <div className="py-1">
            {/* Actions */}
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Actions</div>
            <button
              onClick={handleView}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Voir en détail
            </button>
            <button
              onClick={handleDownload}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </button>

            {/* Pour les devis */}
            {type === 'quote' && (
              <>
                {status === 'accepted' && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Créer</div>
                    <button
                      onClick={handleConvert}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Créer la facture
                    </button>
                  </>
                )}
                {status === 'pending' && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Marquer comme</div>
                    <button
                      onClick={() => {
                        fetch(`/api/quotes/${id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'accepted' }),
                        }).then(() => router.refresh())
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Accepter
                    </button>
                    <button
                      onClick={() => {
                        fetch(`/api/quotes/${id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'rejected' }),
                        }).then(() => router.refresh())
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                      Refuser
                    </button>
                  </>
                )}
              </>
            )}

            {/* Pour les factures */}
            {type === 'invoice' && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Marquer comme</div>
                {status !== 'paid' && (
                  <button
                    onClick={handleMarkAsPaid}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Marquer comme payée
                  </button>
                )}
                {status === 'paid' && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/invoices/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentStatus: 'unpaid' }),
                      })
                      router.refresh()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Marquer comme impayée
                  </button>
                )}
              </>
            )}

            {/* Dupliquer */}
            <div className="border-t border-gray-100 my-1"></div>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Dupliquer</div>
            {type === 'quote' && (
              <button
                onClick={() => {
                  router.push(`/quotes/new?duplicate=${id}`)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer en devis
              </button>
            )}
            {type === 'invoice' && (
              <>
                <button
                  onClick={() => {
                    router.push(`/quotes/new?duplicateInvoice=${id}`)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer en devis
                </button>
                <button
                  onClick={() => {
                    router.push(`/invoices/new?duplicate=${id}`)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer en facture
                </button>
              </>
            )}

            {/* Supprimer */}
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

