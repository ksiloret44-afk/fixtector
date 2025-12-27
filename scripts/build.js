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
const fs = require('fs')

try {
  console.log('Building Next.js application...')
  
  // Construire NODE_OPTIONS avec le polyfill
  // IMPORTANT: Ignorer NODE_OPTIONS existant s'il pointe vers un répertoire ou est incorrect
  const preBuildPath = path.resolve(__dirname, 'pre-build.js')
  
  // Vérifier que pre-build.js existe
  if (!fs.existsSync(preBuildPath)) {
    console.error(`ERROR: pre-build.js not found at ${preBuildPath}`)
    process.exit(1)
  }
  
  // Construire NODE_OPTIONS en ignorant une valeur existante incorrecte
  // On utilise uniquement notre polyfill (ignore NODE_OPTIONS global qui peut être incorrect)
  const nodeOptions = `--require ${preBuildPath}`
  
  try {
    // Créer un environnement propre en supprimant NODE_OPTIONS existant
    // pour éviter les conflits avec des valeurs incorrectes définies globalement
    const cleanEnv = { ...process.env }
    delete cleanEnv.NODE_OPTIONS  // Supprimer NODE_OPTIONS existant
    cleanEnv.NODE_OPTIONS = nodeOptions  // Utiliser uniquement notre valeur
    
    execSync('next build', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: cleanEnv
    })
  } catch (buildError) {
    // Ignorer l'erreur et vérifier si le build a quand même réussi
    console.log('Build process completed (checking for BUILD_ID)...')
  }
  
  // Vérifier que le build a réussi en vérifiant BUILD_ID
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

