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
} from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAdmin = (session?.user as any)?.role === 'admin'

  const isClient = (session?.user as any)?.role === 'client'
  
  const navItems = isClient
    ? [
        { href: '/client', label: 'Mon espace', icon: LayoutDashboard },
      ]
    : [
        { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
        { href: '/repairs', label: 'Réparations', icon: Wrench },
        { href: '/customers', label: 'Clients', icon: Users },
        { href: '/parts', label: 'Stock', icon: Package },
        { href: '/quotes', label: 'Devis', icon: Receipt },
        { href: '/invoices', label: 'Factures', icon: FileText },
        { href: '/team', label: 'Collaborateurs', icon: UserCog },
        { href: '/admin', label: 'Administration', icon: Shield, adminOnly: true },
      ].filter(item => !item.adminOnly || isAdmin)

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={isClient ? "/client" : "/"} className="text-2xl font-bold text-primary-600">
                FixTector
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive(item.href)
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <Link
              href="/profile"
              className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                pathname === '/profile'
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Profil
            </Link>
            <Link
              href="/settings"
              className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                pathname === '/settings'
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          </div>
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
            {!isClient && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/profile'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <User className="w-5 h-5 mr-3" />
                  Profil
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/settings'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Paramètres
                </Link>
              </>
            )}
            <button
              onClick={() => {
                signOut({ callbackUrl: '/login' })
                setMobileMenuOpen(false)
              }}
              className="flex items-center w-full pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
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

