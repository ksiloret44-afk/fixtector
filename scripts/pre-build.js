// Script de pré-build pour définir 'self' globalement
// Ce script est chargé via --require dans NODE_OPTIONS
// Il définit 'self' AVANT que Next.js ne charge ses modules

if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global
    // S'assurer que 'self' est aussi disponible comme propriété
    Object.defineProperty(global, 'self', {
      value: global,
      writable: false,
      enumerable: false,
      configurable: false
    })
  }
}

// Exporter pour que Node.js puisse l'utiliser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = global.self || global
}

