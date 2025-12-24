import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FixTector - Gestion de réparations',
  description: 'Solution complète pour la gestion de votre activité de réparation',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function applyTheme() {
                  try {
                    const savedTheme = localStorage.getItem('theme');
                    const root = document.documentElement;
                    
                    if (savedTheme === 'dark' || savedTheme === 'light') {
                      if (savedTheme === 'dark') {
                        root.classList.add('dark');
                        root.style.colorScheme = 'dark';
                      } else {
                        root.classList.remove('dark');
                        root.style.colorScheme = 'light';
                      }
                      root.setAttribute('data-theme', savedTheme);
                    } else {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if (prefersDark) {
                        root.classList.add('dark');
                        root.style.colorScheme = 'dark';
                        root.setAttribute('data-theme', 'dark');
                      } else {
                        root.classList.remove('dark');
                        root.style.colorScheme = 'light';
                        root.setAttribute('data-theme', 'light');
                      }
                    }
                  } catch (e) {
                    console.error('Erreur lors de l\'application du thème:', e);
                  }
                }
                
                // Appliquer immédiatement
                applyTheme();
                
                // Réappliquer après chaque navigation (pour Next.js)
                if (typeof window !== 'undefined') {
                  // Écouter les changements de localStorage depuis d'autres onglets
                  window.addEventListener('storage', applyTheme);
                  
                  // Réappliquer le thème après chaque navigation
                  const originalPushState = history.pushState;
                  const originalReplaceState = history.replaceState;
                  
                  history.pushState = function() {
                    originalPushState.apply(history, arguments);
                    setTimeout(applyTheme, 0);
                  };
                  
                  history.replaceState = function() {
                    originalReplaceState.apply(history, arguments);
                    setTimeout(applyTheme, 0);
                  };
                  
                  window.addEventListener('popstate', applyTheme);
                  
                  // Observer les changements du DOM pour réappliquer si nécessaire
                  const observer = new MutationObserver(function(mutations) {
                    const root = document.documentElement;
                    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    const hasDarkClass = root.classList.contains('dark');
                    const shouldBeDark = currentTheme === 'dark';
                    
                    if (shouldBeDark !== hasDarkClass) {
                      applyTheme();
                    }
                  });
                  
                  observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['class'],
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

