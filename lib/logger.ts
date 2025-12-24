/**
 * Système de logs en mémoire pour affichage dans le terminal
 */

interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Maximum de logs à garder en mémoire
  private listeners: Set<(logs: LogEntry[]) => void> = new Set()
  // Stocker les méthodes console originales pour éviter la récursion
  private originalConsoleLog?: typeof console.log
  private originalConsoleError?: typeof console.error
  private originalConsoleWarn?: typeof console.warn

  /**
   * Définir les méthodes console originales (appelé une seule fois lors de l'initialisation)
   */
  setOriginalConsoleMethods(
    originalLog: typeof console.log,
    originalError: typeof console.error,
    originalWarn: typeof console.warn
  ) {
    this.originalConsoleLog = originalLog
    this.originalConsoleError = originalError
    this.originalConsoleWarn = originalWarn
  }

  /**
   * Ajouter un log
   */
  addLog(level: LogEntry['level'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    }

    this.logs.push(entry)

    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Notifier les listeners
    this.notifyListeners()

    // Aussi logger dans la console normale en utilisant les méthodes originales pour éviter la récursion
    if (this.originalConsoleLog && this.originalConsoleError && this.originalConsoleWarn) {
      const consoleMethod = level === 'error' ? this.originalConsoleError : level === 'warn' ? this.originalConsoleWarn : this.originalConsoleLog
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '')
    }
  }

  /**
   * Obtenir tous les logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Obtenir les derniers N logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Vider les logs
   */
  clearLogs() {
    this.logs = []
    this.notifyListeners()
  }

  /**
   * Ajouter un listener pour les nouveaux logs
   */
  addListener(callback: (logs: LogEntry[]) => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notifier tous les listeners
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback([...this.logs])
      } catch (error) {
        // Utiliser la méthode originale pour éviter la récursion
        if (this.originalConsoleError) {
          this.originalConsoleError('Erreur dans le listener de logs:', error)
        }
      }
    })
  }

  // Méthodes de convenance
  info(message: string, data?: any) {
    this.addLog('info', message, data)
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data)
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data)
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data)
  }
}

// Instance singleton
export const logger = new Logger()

// Intercepter console.log, console.error, etc. pour capturer les logs
if (typeof window === 'undefined') {
  // Côté serveur uniquement
  // Stocker les méthodes originales AVANT de les intercepter
  const originalLog = console.log.bind(console)
  const originalError = console.error.bind(console)
  const originalWarn = console.warn.bind(console)

  // Configurer le logger avec les méthodes originales
  logger.setOriginalConsoleMethods(originalLog, originalError, originalWarn)

  // Intercepter les méthodes console pour capturer les logs
  console.log = (...args: any[]) => {
    logger.info(args[0] || '', args.slice(1))
    originalLog(...args)
  }

  console.error = (...args: any[]) => {
    logger.error(args[0] || '', args.slice(1))
    originalError(...args)
  }

  console.warn = (...args: any[]) => {
    logger.warn(args[0] || '', args.slice(1))
    originalWarn(...args)
  }
}








