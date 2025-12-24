'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { ThemeProvider } from '@/lib/theme-context'

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const userTheme = (session?.user as any)?.theme as 'light' | 'dark' | undefined
  
  return (
    <ThemeProvider initialTheme={userTheme}>
      {children}
    </ThemeProvider>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
    </SessionProvider>
  )
}

