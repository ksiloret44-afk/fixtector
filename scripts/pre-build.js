// Script de pré-build pour définir 'self' globalement
// Ce script est chargé via --require dans NODE_OPTIONS
// Il définit 'self' AVANT que Next.js ne charge ses modules

// Définir 'self' dans tous les contextes possibles
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

// Définir 'self' dans le contexte global (pour les workers)
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis
    Object.defineProperty(globalThis, 'self', {
      value: globalThis,
      writable: false,
      enumerable: false,
      configurable: false
    })
  }
}

// Intercepter les accès à 'self' via Object.defineProperty sur le prototype
// Cela permet de capturer les accès à 'self' même dans les modules chargés dynamiquement
const originalDefineProperty = Object.defineProperty
Object.defineProperty = function(obj, prop, descriptor) {
  if (prop === 'self' && typeof global !== 'undefined' && obj === global) {
    return originalDefineProperty.call(this, obj, prop, {
      value: global,
      writable: false,
      enumerable: false,
      configurable: false
    })
  }
  return originalDefineProperty.apply(this, arguments)
}

// Exporter pour que Node.js puisse l'utiliser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = global.self || global
}

