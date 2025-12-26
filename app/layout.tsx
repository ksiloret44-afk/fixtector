import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import SubscriptionGuard from '@/components/SubscriptionGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FixTector - Gestion de réparations',
  description: 'Solution complète pour la gestion de votre activité de réparation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </Providers>
      </body>
    </html>
  )
}
