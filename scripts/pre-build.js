// Script de pré-build pour définir 'self' globalement
// Ce script doit être exécuté avant le build Next.js

if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global
  }
}

// Exporter pour que Node.js puisse l'utiliser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = global.self || global
}

