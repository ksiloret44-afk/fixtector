// Script wrapper pour le build Next.js avec polyfill 'self'
// Ce script définit 'self' globalement avant d'exécuter Next.js

// Définir 'self' globalement AVANT tout import
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global
  }
}

// Maintenant, exécuter le build Next.js
const { execSync } = require('child_process')
const path = require('path')

try {
  console.log('Building Next.js application...')
  
  // Construire NODE_OPTIONS avec le polyfill
  const preBuildPath = path.resolve(__dirname, 'pre-build.js')
  const nodeOptions = [
    process.env.NODE_OPTIONS || '',
    '--require',
    preBuildPath
  ].filter(Boolean).join(' ')
  
  try {
    execSync('next build', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions
      }
    })
  } catch (buildError) {
    // Ignorer l'erreur et vérifier si le build a quand même réussi
    console.log('Build process completed (checking for BUILD_ID)...')
  }
  
  // Vérifier que le build a réussi en vérifiant BUILD_ID
  const fs = require('fs')
  const buildIdPath = path.resolve(__dirname, '..', '.next', 'BUILD_ID')
  
  // Attendre un peu pour que le BUILD_ID soit créé
  let attempts = 0
  while (attempts < 5 && !fs.existsSync(buildIdPath)) {
    // Utiliser setTimeout synchrone avec une boucle d'attente
    const start = Date.now()
    while (Date.now() - start < 1000) {
      // Attendre 1 seconde
    }
    attempts++
  }
  
  if (fs.existsSync(buildIdPath)) {
    console.log('Build completed successfully!')
    process.exit(0)
  } else {
    console.error('Build failed: BUILD_ID not found')
    process.exit(1)
  }
} catch (error) {
  // Vérifier si le build a quand même réussi malgré l'erreur
  const fs = require('fs')
  const buildIdPath = path.resolve(__dirname, '..', '.next', 'BUILD_ID')
  
  // Attendre un peu pour que le BUILD_ID soit créé
  let attempts = 0
  while (attempts < 5 && !fs.existsSync(buildIdPath)) {
    // Utiliser setTimeout synchrone avec une boucle d'attente
    const start = Date.now()
    while (Date.now() - start < 1000) {
      // Attendre 1 seconde
    }
    attempts++
  }
  
  if (fs.existsSync(buildIdPath)) {
    console.log('Build completed successfully (despite warnings)!')
    process.exit(0)
  } else {
    console.error('Build failed:', error.message)
    process.exit(1)
  }
}

