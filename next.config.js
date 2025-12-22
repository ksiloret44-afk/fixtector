/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Permettre l'import des clients Prisma générés
    config.resolve.alias = {
      ...config.resolve.alias,
      '.prisma/client-main': require('path').join(__dirname, 'node_modules/.prisma/client-main'),
      '.prisma/client-company': require('path').join(__dirname, 'node_modules/.prisma/client-company'),
    }
    return config
  },
}

module.exports = nextConfig

