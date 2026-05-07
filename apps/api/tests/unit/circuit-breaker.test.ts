import {
  CircuitBreaker,
  CircuitOpenError,
  withRetry,
} from '../../../../packages/ai-core/src/circuit-breaker'

// ─────────────────────────────────────────────────────────────────
// CIRCUIT BREAKER STATE MACHINE
// ─────────────────────────────────────────────────────────────────

describe('CircuitBreaker — State Machine', () => {
  const mkCB = (overrides = {}) =>
    new CircuitBreaker('test', {
      failureThreshold: 3,
      successThreshold: 2,
      cooldownMs:       100,
      requestTimeout:   5_000,
      ...overrides,
    })

  it('starts in CLOSED state', () => {
    expect(mkCB().getStats().state).toBe('CLOSED')
  })

  it('stays CLOSED under failureThreshold', async () => {
    const cb   = mkCB()
    const fail = () => Promise.reject(new Error('x'))
    await cb.execute(fail).catch(() => {})
    await cb.execute(fail).catch(() => {})
    expect(cb.getStats().state).toBe('CLOSED')
    expect(cb.getStats().failures).toBe(2)
  })

  it('transitions CLOSED → OPEN at exactly failureThreshold', async () => {
    const cb   = mkCB({ failureThreshold: 3 })
    const fail = () => Promise.reject(new Error('x'))
    for (let i = 0; i < 3; i++) await cb.execute(fail).catch(() => {})
    expect(cb.getStats().state).toBe('OPEN')
  })

  it('throws CircuitOpenError when OPEN (does not call fn)', async () => {
    const cb  = mkCB({ failureThreshold: 1 })
    const spy = jest.fn().mockRejectedValue(new Error('x'))
    await cb.execute(spy).catch(() => {})
    expect(cb.getStats().state).toBe('OPEN')
    spy.mockClear()

    await expect(cb.execute(spy)).rejects.toBeInstanceOf(CircuitOpenError)
    expect(spy).not.toHaveBeenCalled()     // ← function never called when OPEN
  })

  it('transitions OPEN → HALF_OPEN after cooldown', async () => {
    const cb = mkCB({ failureThreshold: 1, cooldownMs: 50 })
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {})
    expect(cb.getStats().state).toBe('OPEN')

    await new Promise(r => setTimeout(r, 60))
    expect(cb.isAvailable()).toBe(true)    // should probe
  })

  it('transitions HALF_OPEN → CLOSED after successThreshold successes', async () => {
    const cb = mkCB({ failureThreshold: 1, successThreshold: 2, cooldownMs: 50 })
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {})
    await new Promise(r => setTimeout(r, 60))

    await cb.execute(() => Promise.resolve('ok'))  // probe — HALF_OPEN
    await cb.execute(() => Promise.resolve('ok'))  // 2nd success
    expect(cb.getStats().state).toBe('CLOSED')
  })

  it('transitions HALF_OPEN → OPEN on failure in probe', async () => {
    const cb = mkCB({ failureThreshold: 1, cooldownMs: 50 })
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {})
    await new Promise(r => setTimeout(r, 60))

    await cb.execute(() => Promise.reject(new Error('probe fail'))).catch(() => {})
    expect(cb.getStats().state).toBe('OPEN')
  })

  it('resets counters after successful CLOSED transition', async () => {
    const cb = mkCB({ failureThreshold: 1, successThreshold: 1, cooldownMs: 50 })
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {})
    await new Promise(r => setTimeout(r, 60))
    await cb.execute(() => Promise.resolve('ok'))

    expect(cb.getStats().failures).toBe(0)
    expect(cb.getStats().state).toBe('CLOSED')
  })

  it('times out requests exceeding requestTimeout', async () => {
    const cb = mkCB({ requestTimeout: 50 })
    const slow = () => new Promise(r => setTimeout(r, 500))

    await expect(cb.execute(slow)).rejects.toThrow(/timeout/)
  })

  it('reset() returns to CLOSED immediately', async () => {
    const cb = mkCB({ failureThreshold: 1, cooldownMs: 999_999 })
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {})
    expect(cb.getStats().state).toBe('OPEN')
    cb.reset()
    expect(cb.getStats().state).toBe('CLOSED')
  })

  it('tracks totalRequests and totalFailures across resets', async () => {
    const cb   = mkCB({ failureThreshold: 5 })
    const fail = () => Promise.reject(new Error('x'))
    await cb.execute(fail).catch(() => {})
    await cb.execute(fail).catch(() => {})
    await cb.execute(() => Promise.resolve('ok'))

    const stats = cb.getStats()
    expect(stats.totalRequests).toBe(3)
    expect(stats.totalFailures).toBe(2)
  })
})
