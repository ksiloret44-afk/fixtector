// Polyfill pour 'self' (utilisé par certaines dépendances)
// Ce module exporte 'self' pour être utilisé comme polyfill
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global
  }
  module.exports = global.self
} else if (typeof window !== 'undefined') {
  if (typeof window.self === 'undefined') {
    window.self = window
  }
  module.exports = window.self
} else {
  module.exports = {}
}

