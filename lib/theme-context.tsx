'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme }) {
  // Utiliser 'light' par défaut pour éviter les différences SSR/CSR
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const { data: session, update: updateSession } = useSession()
  const sessionTheme = (session?.user as any)?.theme as Theme | undefined
  const userId = (session?.user as any)?.id as string | undefined
  const previousUserIdRef = useRef<string | undefined>(undefined)

  // Obtenir la clé localStorage unique pour cet utilisateur
  const getThemeStorageKey = (uid?: string) => {
    const currentUserId = uid || userId
    if (!currentUserId) return 'theme-guest'
    return `theme-${currentUserId}`
  }

  // Fonction pour appliquer le thème au DOM
  const applyTheme = (newTheme: Theme, saveToStorage = true) => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    // Forcer l'application du thème de manière synchrone
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    
    // Sauvegarder dans localStorage avec une clé unique par utilisateur
    if (saveToStorage) {
      const storageKey = getThemeStorageKey()
      localStorage.setItem(storageKey, newTheme)
      // Nettoyer l'ancienne clé globale si elle existe (pour migration)
      if (localStorage.getItem('theme') && userId) {
        localStorage.removeItem('theme')
      }
    }
    
    root.setAttribute('data-theme', newTheme)
    
    // Déclencher un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }))
  }

  useEffect(() => {
    setMounted(true)
    
    // Détecter si l'utilisateur a changé
    const currentUserId = userId
    const previousUserId = previousUserIdRef.current
    
    // Si l'utilisateur a changé, nettoyer le cache et recharger le thème
    if (previousUserId !== undefined && previousUserId !== currentUserId) {
      // Nettoyer l'ancien cache si nécessaire
      if (previousUserId) {
        const oldKey = getThemeStorageKey(previousUserId)
        // On garde l'ancien cache au cas où l'utilisateur se reconnecte
      }
    }
    
    previousUserIdRef.current = currentUserId
    
    // Obtenir la clé de stockage pour l'utilisateur actuel
    const storageKey = getThemeStorageKey()
    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    
    // Charger le thème avec la bonne priorité
    const loadTheme = async () => {
      // Priorité 1: sessionTheme (depuis la session NextAuth) - TOUJOURS prioritaire
      if (sessionTheme && (sessionTheme === 'light' || sessionTheme === 'dark')) {
        setThemeState(sessionTheme)
        applyTheme(sessionTheme, true)
        return
      }
      
      // Priorité 2: initialTheme (prop passée)
      if (initialTheme && (initialTheme === 'light' || initialTheme === 'dark')) {
        setThemeState(initialTheme)
        applyTheme(initialTheme, true)
        return
      }
      
      // Priorité 3: localStorage avec clé unique par utilisateur
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeState(savedTheme)
        applyTheme(savedTheme, false) // Ne pas sauvegarder, c'est déjà dans localStorage
        return
      }
      
      // Priorité 4: API (base de données) - seulement si pas de session
      if (!session) {
        try {
          const response = await fetch('/api/settings/theme')
          if (response.ok) {
            const data = await response.json()
            if (data.theme && (data.theme === 'light' || data.theme === 'dark')) {
              setThemeState(data.theme)
              applyTheme(data.theme, true)
              return
            }
          }
        } catch (e) {
          console.error('Erreur lors du chargement du thème:', e)
        }
      }
      
      // Priorité 5: Préférence système
      if (!savedTheme && !initialTheme && !sessionTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const defaultTheme = prefersDark ? 'dark' : 'light'
        setThemeState(defaultTheme)
        applyTheme(defaultTheme, true)
      }
    }
    
    loadTheme()
    
    // Réappliquer le thème après chaque navigation Next.js
    const handleRouteChange = () => {
      const storageKey = getThemeStorageKey()
      const currentTheme = localStorage.getItem(storageKey) as Theme | null
      if (currentTheme && (currentTheme === 'light' || currentTheme === 'dark')) {
        applyTheme(currentTheme, false)
      } else if (sessionTheme && (sessionTheme === 'light' || sessionTheme === 'dark')) {
        // Si pas de localStorage, utiliser le thème de la session
        applyTheme(sessionTheme, false)
      }
    }
    
    // Écouter les événements de navigation Next.js
    window.addEventListener('popstate', handleRouteChange)
    
    // Écouter les changements de localStorage depuis d'autres onglets
    // Note: on écoute toutes les clés theme-* pour détecter les changements
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('theme-')) {
        // Vérifier si c'est la clé de l'utilisateur actuel
        if (e.key === getThemeStorageKey() && e.newValue) {
          const newTheme = e.newValue as Theme
          if (newTheme === 'light' || newTheme === 'dark') {
            setThemeState(newTheme)
            applyTheme(newTheme, false)
          }
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Écouter l'événement personnalisé de changement de thème
    window.addEventListener('themechange', ((e: CustomEvent) => {
      if (e.detail && e.detail.theme) {
        setThemeState(e.detail.theme)
      }
    }) as EventListener)
    
    // Observer les changements du DOM pour réappliquer si nécessaire
    const observer = new MutationObserver(() => {
      const root = document.documentElement
      const storageKey = getThemeStorageKey()
      const currentTheme = localStorage.getItem(storageKey) as Theme | null
      const sessionThemeValue = sessionTheme
      
      // Utiliser le thème de la session en priorité, sinon localStorage
      const themeToUse = sessionThemeValue || currentTheme
      
      if (themeToUse && (themeToUse === 'light' || themeToUse === 'dark')) {
        const shouldBeDark = themeToUse === 'dark'
        const isDark = root.classList.contains('dark')
        if (shouldBeDark !== isDark) {
          applyTheme(themeToUse, false)
        }
      }
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('storage', handleStorageChange)
      observer.disconnect()
    }
  }, [initialTheme, sessionTheme, session, userId])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme, true)
    
    // Sauvegarder dans la base de données si l'utilisateur est connecté
    if (typeof window !== 'undefined' && userId) {
      try {
        const response = await fetch('/api/settings/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme }),
        })
        const data = await response.json()
        if (!response.ok) {
          console.error('Erreur lors de la sauvegarde du thème:', data.error || data.details)
        } else {
          // Le thème a été sauvegardé avec succès, rafraîchir la session NextAuth
          // pour que le nouveau thème soit disponible immédiatement
          try {
            await updateSession()
          } catch (updateError) {
            console.error('Erreur lors de la mise à jour de la session:', updateError)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du thème:', error)
      }
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Toujours retourner le provider pour éviter les différences d'hydratation
  // Le script dans layout.tsx gère déjà l'application initiale du thème
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Fallback si le contexte n'est pas disponible (SSR ou composant en dehors du provider)
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    }
  }
  return context
}
