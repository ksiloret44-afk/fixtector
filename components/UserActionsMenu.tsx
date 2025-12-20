'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Lock, Ban, Unlock, Trash2, Edit, User } from 'lucide-react'

interface UserActionsMenuProps {
  userId: string
  suspended: boolean
  onPasswordChange: () => void
  onSuspend: () => void
  onDelete: () => void
  onEdit: () => void
  onViewDetails: () => void
}

export default function UserActionsMenu({ 
  userId, 
  suspended, 
  onPasswordChange, 
  onSuspend, 
  onDelete,
  onEdit,
  onViewDetails
}: UserActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 224, // w-56 = 224px
      })
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const menuContent = isOpen ? (
    <>
      <div 
        className="fixed inset-0 z-[99]" 
        onClick={() => setIsOpen(false)}
      />
      <div 
        ref={menuRef}
        className="fixed w-56 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 z-[100] border border-gray-200 overflow-hidden"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      >
        <div className="py-1">
          {/* Informations */}
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Informations</div>
          <button
            onClick={() => {
              onViewDetails()
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <User className="h-4 w-4 mr-2" />
            Voir les détails
          </button>
          <button
            onClick={() => {
              onEdit()
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier les informations
          </button>

          {/* Gestion du compte */}
          <div className="border-t border-gray-100 my-1"></div>
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Gestion du compte</div>
          <button
            onClick={() => {
              onPasswordChange()
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Lock className="h-4 w-4 mr-2" />
            Changer le mot de passe
          </button>
          <button
            onClick={() => {
              onSuspend()
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            {suspended ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Réactiver le compte
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Suspendre le compte
              </>
            )}
          </button>

          {/* Supprimer */}
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => {
              onDelete()
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </button>
        </div>
      </div>
    </>
  ) : null

  return (
    <>
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <button
          ref={buttonRef}
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
      </div>
      {typeof window !== 'undefined' && menuContent && createPortal(menuContent, document.body)}
    </>
  )
}

