/** @type {import('next').NextConfig} */
const path = require('path')
const fs = require('fs')

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
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
    
    return config
  },
}

module.exports = nextConfig
