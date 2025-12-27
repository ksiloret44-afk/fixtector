// Polyfill pour 'self' (utilisé par certaines dépendances)
// Ce fichier doit être importé au début de l'application
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  (global as any).self = global
}

if (typeof window !== 'undefined' && typeof window.self === 'undefined') {
  (window as any).self = window
}


