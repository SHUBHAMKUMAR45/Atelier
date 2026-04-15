import { sleep } from '../../../shared/src/utils'

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  failureThreshold: number     // failures before OPEN
  successThreshold: number     // successes in HALF_OPEN before CLOSED
  cooldownMs:       number     // OPEN → HALF_OPEN delay
  requestTimeout:   number     // per-request timeout (ms)
}

export interface CircuitBreakerStats {
  state:           CircuitState
  failures:        number
  successes:       number
  lastFailureAt:   number | null
  totalRequests:   number
  totalFailures:   number
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  cooldownMs:       120_000,   // 2 minutes
  requestTimeout:   30_000,    // 30 seconds
}

// ─────────────────────────────────────────────────────────────────
// CIRCUIT BREAKER
// ─────────────────────────────────────────────────────────────────

export class CircuitBreaker {
  private state:         CircuitState = 'CLOSED'
  private failures:      number       = 0
  private successes:     number       = 0
  private lastFailureAt: number | null = null
  private totalRequests: number       = 0
  private totalFailures: number       = 0
  private readonly config: CircuitBreakerConfig
  private readonly name: string

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name   = name
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++

    if (this.state === 'OPEN') {
      if (!this.shouldAttemptReset()) {
        throw new CircuitOpenError(this.name)
      }
      this.transitionTo('HALF_OPEN')
    }

    try {
      const result = await this.withTimeout(fn(), this.config.requestTimeout)
      this.onSuccess()
      return result
    } catch (error) {
      if (error instanceof CircuitOpenError) throw error
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    if (this.state === 'HALF_OPEN') {
      this.successes++
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('CLOSED')
      }
    }
  }

  private onFailure(): void {
    this.failures++
    this.totalFailures++
    this.lastFailureAt = Date.now()

    if (
      this.state === 'CLOSED' &&
      this.failures >= this.config.failureThreshold
    ) {
      this.transitionTo('OPEN')
    } else if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN')
    }
  }

  private transitionTo(next: CircuitState): void {
    this.state     = next
    this.successes = 0
    if (next === 'CLOSED') {
      this.failures = 0
    }
  }

  private shouldAttemptReset(): boolean {
    if (this.lastFailureAt === null) return true
    return Date.now() - this.lastFailureAt >= this.config.cooldownMs
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Circuit breaker timeout after ${ms}ms`)),
          ms,
        ),
      ),
    ])
  }

  isAvailable(): boolean {
    return (
      this.state === 'CLOSED' ||
      (this.state === 'OPEN' && this.shouldAttemptReset())
    )
  }

  getStats(): CircuitBreakerStats {
    return {
      state:         this.state,
      failures:      this.failures,
      successes:     this.successes,
      lastFailureAt: this.lastFailureAt,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    }
  }

  reset(): void {
    this.state         = 'CLOSED'
    this.failures      = 0
    this.successes     = 0
    this.lastFailureAt = null
  }
}

export class CircuitOpenError extends Error {
  readonly provider: string
  constructor(provider: string) {
    super(`Circuit breaker OPEN for provider: ${provider}`)
    this.name     = 'CircuitOpenError'
    this.provider = provider
  }
}

// ─────────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────────────────────────

export interface RetryConfig {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs:  number
  jitter:      boolean
}

const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs:  10_000,
  jitter:      true,
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg    = { ...DEFAULT_RETRY, ...config }
  let lastError: Error = new Error('Unknown error')

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === cfg.maxAttempts) break

      const exponential = cfg.baseDelayMs * Math.pow(2, attempt - 1)
      const capped      = Math.min(exponential, cfg.maxDelayMs)
      const jitter      = cfg.jitter ? Math.random() * 0.3 * capped : 0
      const delay       = Math.floor(capped + jitter)

      await sleep(delay)
    }
  }

  throw lastError
}
