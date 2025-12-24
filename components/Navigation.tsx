'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  FileText,
  Receipt,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  Shield,
  UserCog,
  BarChart3,
  Calendar,
  Download,
  ChevronDown,
  Star,
  MessageSquare,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import TrialCountdown from './TrialCountdown'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const subMenuRef = useRef<HTMLDivElement>(null)
  const isAdmin = (session?.user as any)?.role === 'admin'

  const isClient = (session?.user as any)?.role === 'client'
  
  // Fermer le sous-menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setSubMenuOpen(false)
      }
    }

    if (subMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [subMenuOpen])
  
  const navItems = isClient
    ? [
        { href: '/client', label: 'Mon espace', icon: LayoutDashboard },
        { href: '/client/reviews', label: 'Laisser un avis', icon: Star },
      ]
    : [
        { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
        { href: '/repairs', label: 'Réparations', icon: Wrench },
        { href: '/customers', label: 'Clients', icon: Users },
        { href: '/parts', label: 'Stock', icon: Package },
        { href: '/quotes', label: 'Devis', icon: Receipt },
        { href: '/invoices', label: 'Factures', icon: FileText },
        { href: '/reports', label: 'Rapports', icon: BarChart3 },
        { href: '/appointments', label: 'Rendez-vous', icon: Calendar },
      ]
  
      const subMenuItems = [
        { href: '/profile', label: 'Profil', icon: User },
        { href: '/team', label: 'Collaborateurs', icon: UserCog },
        { href: '/reviews', label: 'Avis clients', icon: Star },
        { href: '/company-review', label: 'Laisser un avis', icon: Star, hideForAdmin: true },
        { href: '/chatbot', label: 'Chatbot', icon: MessageSquare, adminOnly: true },
        { href: '/settings', label: 'Paramètres', icon: Settings },
        { href: '/updates', label: 'Mises à jour', icon: Download, adminOnly: true },
        { href: '/admin', label: 'Administration', icon: Shield, adminOnly: true },
      ].filter(item => {
        if (item.adminOnly && !isAdmin) return false
        if (item.hideForAdmin && isAdmin) return false
        return true
      })
  
  const isSubMenuActive = subMenuItems.some(item => {
    if (item.href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(item.href)
  })

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
              <div className="flex-shrink-0 flex items-center space-x-4">
                {!isAdmin && <TrialCountdown />}
                <Link href={isClient ? "/client" : "/"} className="flex items-center space-x-2">
                  <img src="/logo.svg" alt="FixTector" className="h-10" />
                </Link>
              </div>
          <div className="hidden sm:flex sm:flex-1 sm:justify-center">
            <div className="flex space-x-6 items-center">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive(item.href)
                        ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
              
              {/* Sous-menu */}
              {!isClient && (
                <div className="relative" ref={subMenuRef}>
                  <button
                    onClick={() => setSubMenuOpen(!subMenuOpen)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isSubMenuActive
                        ? 'border-primary-500 text-gray-900 dark:text-gray-100'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Plus
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${subMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {subMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                      {subMenuItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSubMenuOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive(item.href)
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-4 sm:flex-shrink-0">
            <button
              onClick={() => signOut({ callbackUrl: '/landing' })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          </div>
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
            {!isClient && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <div className="pl-3 pr-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plus
                </div>
                {subMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center pl-6 pr-4 py-2 border-l-4 text-base font-medium ${
                        isActive(item.href)
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  )
                })}
              </>
            )}
            <button
              onClick={() => {
                signOut({ callbackUrl: '/landing' })
                setMobileMenuOpen(false)
              }}
              className="flex items-center w-full pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

