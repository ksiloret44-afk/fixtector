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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FixTector" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
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
