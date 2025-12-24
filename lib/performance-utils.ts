/**
 * Utilitaires de performance pour optimiser les requêtes et le cache
 */

// Cache simple en mémoire pour les données fréquemment accédées
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

export const cache = new SimpleCache()

/**
 * Debounce function pour limiter les appels fréquents
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function pour limiter la fréquence d'exécution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Batch les requêtes pour réduire le nombre d'appels
 */
export class RequestBatcher<T, R> {
  private batch: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = []
  private timeout: NodeJS.Timeout | null = null

  constructor(
    private batchFn: (items: T[]) => Promise<R[]>,
    private wait: number = 50
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push({ item, resolve, reject })

      if (this.timeout) {
        clearTimeout(this.timeout)
      }

      this.timeout = setTimeout(() => {
        this.flush()
      }, this.wait)
    })
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return

    const currentBatch = [...this.batch]
    this.batch = []
    this.timeout = null

    try {
      const items = currentBatch.map((b) => b.item)
      const results = await this.batchFn(items)

      currentBatch.forEach((b, index) => {
        b.resolve(results[index])
      })
    } catch (error) {
      currentBatch.forEach((b) => {
        b.reject(error)
      })
    }
  }
}

/**
 * Mesure le temps d'exécution d'une fonction
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
  }

  return { result, duration }
}

/**
 * Retry avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}












