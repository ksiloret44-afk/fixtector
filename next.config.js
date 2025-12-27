/** @type {import('next').NextConfig} */
// Définir 'self' globalement AVANT tout import
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global
}

const path = require('path')
const fs = require('fs')

// Polyfill pour 'self' (doit être défini avant tout)
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global
}

const nextConfig = {
  reactStrictMode: true,
  
  // Optimisations de performance
  compress: true, // Activer la compression Gzip/Brotli
  poweredByHeader: false, // Retirer le header X-Powered-By pour la sécurité et performance
  
  // Optimisation des images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Optimisation du build
  swcMinify: true, // Utiliser SWC pour la minification (plus rapide que Terser)
  
  // Optimisation des exports
  experimental: {
    // optimizeCss: true, // Désactivé temporairement - cause des problèmes avec PostCSS/Tailwind
    optimizePackageImports: ['lucide-react', 'date-fns'], // Tree-shaking amélioré
    // serverComponentsExternalPackages retiré - causait des problèmes avec webpack-runtime
  },
  
  webpack: (config, { isServer, dev }) => {
    // Exclure les fichiers de script du build
    config.module.rules.push({
      test: /check-user\.ts$/,
      use: 'ignore-loader',
    })
    
    // Permettre l'import des clients Prisma générés (compatible Windows et Linux)
    // Utiliser process.cwd() pour obtenir le répertoire de travail actuel (compatible avec les deux OS)
    const prismaMainPath = path.resolve(process.cwd(), 'node_modules/.prisma/client-main')
    const prismaCompanyPath = path.resolve(process.cwd(), 'node_modules/.prisma/client-company')
    
    // Vérifier que les chemins existent (pour debug)
    if (!fs.existsSync(prismaMainPath)) {
      console.warn(`[WARN] Prisma client-main not found at: ${prismaMainPath}`)
    }
    if (!fs.existsSync(prismaCompanyPath)) {
      console.warn(`[WARN] Prisma client-company not found at: ${prismaCompanyPath}`)
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '.prisma/client-main': prismaMainPath,
      '.prisma/client-company': prismaCompanyPath,
    }
    
    // Ajouter node_modules aux modules résolvables pour une meilleure compatibilité
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(process.cwd(), 'node_modules'),
    ]
    
    // Ignorer les modules Node.js côté client (pour twilio, nodemailer, etc.)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
      }
    }
    
    // Optimisations webpack en production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Créer un chunk séparé pour les vendors
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Créer un chunk séparé pour les composants communs
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
