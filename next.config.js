/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Permettre l'import des clients Prisma générés (compatible Windows et Linux)
    const prismaMainPath = path.resolve(__dirname, 'node_modules/.prisma/client-main')
    const prismaCompanyPath = path.resolve(__dirname, 'node_modules/.prisma/client-company')
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '.prisma/client-main': prismaMainPath,
      '.prisma/client-company': prismaCompanyPath,
    }
    
    // Ajouter les dossiers Prisma aux modules résolvables
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, 'node_modules'),
    ]
    
    return config
  },
}

module.exports = nextConfig

