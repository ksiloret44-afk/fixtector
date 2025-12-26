// Polyfill pour 'self' (utilisé par certaines dépendances)
// Ce fichier doit être chargé avant toute autre chose
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global
}

if (typeof window !== 'undefined' && typeof window.self === 'undefined') {
  window.self = window
}

