/**
 * AI Validation Test Suite — Anti-Hallucination Engine
 *
 * Laws enforced:
 *   LAW 1 — No hallucination: invalid JSON → rejected
 *   LAW 2 — Strict schema: Zod validates every field
 *   LAW 3 — Deterministic: same input → same cache key
 *   LAW 4 — Failure safety: bad AI → fallback fires, no crash
 *   LAW 6 — Cost protection: no duplicate AI calls
 */

import { AIOrchestrator }       from '../../../../packages/ai-core/src/orchestrator'
import { AIOutfitOutputSchema, AITrendOutputSchema } from '../../../../packages/shared/src/schemas'
import { GeminiProvider }       from '../../../../packages/ai-core/src/providers/gemini.provider'
import { OpenAIProvider }       from '../../../../packages/ai-core/src/providers/openai.provider'
import { hashRequestId, hashCacheKey } from '../../../../packages/shared/src/utils'

jest.mock('../../../../packages/ai-core/src/providers/gemini.provider')
jest.mock('../../../../packages/ai-core/src/providers/openai.provider')

const mockGemini = jest.fn()
const mockOpenAI = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(GeminiProvider as jest.Mock).mockImplementation(() => ({
    generateOutfit: mockGemini,
    generateTrends: jest.fn().mockRejectedValue(new Error('not needed')),
  }))
  ;(OpenAIProvider as jest.Mock).mockImplementation(() => ({
    generateOutfit: mockOpenAI,
    generateTrends: jest.fn().mockRejectedValue(new Error('not needed')),
  }))
})

const noCache    = jest.fn().mockResolvedValue(null)
const noSetCache = jest.fn().mockResolvedValue(undefined)

const BASE_INPUT = {
  occasion:    'casual' as const,
  description: 'casual outing',
  weather:     { temp: 20, condition: 'clear', humidity: 55, windSpeed: 10 },
  preferences: {
    styles:      ['casual'] as ['casual'],
    colors:      [],
    avoidColors: [],
    occasions:   ['casual'] as ['casual'],
    budget:      'mid' as const,
    gender:      'prefer-not-to-say' as const,
  },
  measurements: undefined,
  location:    'New York',
  traceId:     'test-trace-001',
}

const VALID_OUTFIT = {
  title: 'Weekend casual', description: 'Relaxed weekend outfit',
  items: [
    { category: 'top',    name: 'White Tee',  description: 'Classic', color: 'White', style: 'casual', priceRange: 'mid', searchTerms: ['white tee'] },
    { category: 'bottom', name: 'Blue Jeans', description: 'Straight', color: 'Blue', style: 'casual', priceRange: 'mid', searchTerms: ['jeans'] },
    { category: 'shoes',  name: 'Sneakers',   description: 'Clean',   color: 'White', style: 'casual', priceRange: 'mid', searchTerms: ['sneakers'] },
  ],
  stylingTips: ['Keep it simple'], colorPalette: ['#FFFFFF', '#1A237E'], confidenceScore: 0.85,
}

// ─────────────────────────────────────────────────────────────────
// LAW 1 + 2: Schema Validation — every invalid shape rejected
// ─────────────────────────────────────────────────────────────────

describe('LAW 1 + 2 — Schema Validation & Anti-Hallucination', () => {

  const INVALID_OUTPUTS = [
    { name: 'raw string output',                value: 'Here is your outfit! Casual look.' },
    { name: 'missing title field',              value: { description: 'd', items: [], stylingTips: [], colorPalette: [], confidenceScore: 0.8 } },
    { name: 'hallucinated top-level fields',    value: { outfit: { items: [] }, price: '$200', available: true } },
    { name: 'empty items array (min:2)',         value: { title: 't', description: 'd', items: [], stylingTips: [], colorPalette: ['#FFF'], confidenceScore: 0.9 } },
    { name: 'too many items (max:8 violated)',   value: { title: 't', description: 'd', items: Array(10).fill({ category: 'top', name: 'x', description: 'x', color: 'White', style: 'casual', priceRange: 'mid', searchTerms: ['x'] }), stylingTips: [], colorPalette: ['#FFF'], confidenceScore: 0.9 } },
    { name: 'colorPalette with invalid hex',    value: { ...VALID_OUTFIT, colorPalette: ['white', 'black'] } },
    { name: 'confidenceScore > 1',              value: { ...VALID_OUTFIT, confidenceScore: 1.5 } },
    { name: 'confidenceScore < 0',              value: { ...VALID_OUTFIT, confidenceScore: -0.1 } },
    { name: 'invalid item category',            value: { ...VALID_OUTFIT, items: [ { category: 'underwear', name: 'x', description: 'x', color: 'White', style: 'casual', priceRange: 'mid', searchTerms: ['x'] }, VALID_OUTFIT.items[1] ] } },
    { name: 'invalid priceRange',               value: { ...VALID_OUTFIT, items: [ { ...VALID_OUTFIT.items[0], priceRange: 'ultra-premium' }, VALID_OUTFIT.items[1] ] } },
    { name: 'null output',                      value: null },
    { name: 'empty object',                     value: {} },
  ]

  for (const { name, value } of INVALID_OUTPUTS) {
    it(`Zod rejects: ${name}`, () => {
      const result = AIOutfitOutputSchema.safeParse(value)
      expect(result.success).toBe(false)
    })
  }

  it('Zod accepts: valid well-formed outfit', () => {
    expect(AIOutfitOutputSchema.safeParse(VALID_OUTFIT).success).toBe(true)
  })

  it('Zod accepts: outfit with 8 items (max boundary)', () => {
    const maxItems = { ...VALID_OUTFIT, items: Array(8).fill(VALID_OUTFIT.items[0]) }
    expect(AIOutfitOutputSchema.safeParse(maxItems).success).toBe(true)
  })

  it('Zod accepts: confidence = 0 (min boundary)', () => {
    expect(AIOutfitOutputSchema.safeParse({ ...VALID_OUTFIT, confidenceScore: 0 }).success).toBe(true)
  })

  it('Zod accepts: confidence = 1 (max boundary)', () => {
    expect(AIOutfitOutputSchema.safeParse({ ...VALID_OUTFIT, confidenceScore: 1 }).success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// LAW 4: Failure Safety — system never crashes
// ─────────────────────────────────────────────────────────────────

describe('LAW 4 — Failure Safety (no crash under any condition)', () => {

  it('both providers fail → degraded fallback returned (not thrown)', async () => {
    mockGemini.mockRejectedValue(new Error('AI unavailable'))
    mockOpenAI.mockRejectedValue(new Error('AI unavailable'))

    const orch = new AIOrchestrator({
      geminiApiKey: 'k', openaiApiKey: 'k',
    })
    const result = await orch.generateOutfit(BASE_INPUT, 'law4-test', noCache, noSetCache)

    expect(result).toBeDefined()
    expect(typeof result.data.title).toBe('string')
    expect(result.data.items.length).toBeGreaterThanOrEqual(2)
    expect(result.data.confidenceScore).toBe(0.5)   // degraded marker
    expect(result.provider).toBe('cached')
  }, 20_000)

  it('providers throw TypeError → resolved with fallback, not rejected', async () => {
    mockGemini.mockImplementation(() => { throw new TypeError('Cannot read property') })
    mockOpenAI.mockImplementation(() => { throw new SyntaxError('Unexpected token') })

    const orch = new AIOrchestrator({ geminiApiKey: 'k', openaiApiKey: 'k' })
    await expect(
      orch.generateOutfit(BASE_INPUT, 'typeerror-test', noCache, noSetCache)
    ).resolves.toMatchObject({ data: expect.objectContaining({ title: expect.any(String) }) })
  }, 20_000)

  it('10 concurrent requests all resolve (no crash)', async () => {
    mockGemini.mockRejectedValue(new Error('overloaded'))
    mockOpenAI.mockRejectedValue(new Error('overloaded'))

    const orch = new AIOrchestrator({
      geminiApiKey: 'k', openaiApiKey: 'k',
    })

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        orch.generateOutfit(BASE_INPUT, `concurrent-${i}`, noCache, noSetCache)
      )
    )

    const rejected = results.filter(r => r.status === 'rejected').length
    expect(rejected).toBe(0)
  }, 60_000)

  it('cache hit prevents AI call entirely', async () => {
    const getCache = jest.fn().mockResolvedValue(VALID_OUTFIT)

    const orch = new AIOrchestrator({ geminiApiKey: 'k', openaiApiKey: 'k' })
    const result = await orch.generateOutfit(BASE_INPUT, 'cached-key', getCache, noSetCache)

    expect(mockGemini).not.toHaveBeenCalled()
    expect(mockOpenAI).not.toHaveBeenCalled()
    expect(result.provider).toBe('cached')
  })
})

// ─────────────────────────────────────────────────────────────────
// LAW 3: Deterministic output
// ─────────────────────────────────────────────────────────────────

describe('LAW 3 — Deterministic Cache Keys', () => {

  it('identical inputs → identical key', () => {
    const k1 = hashRequestId('user1', 'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['casual'] })
    const k2 = hashRequestId('user1', 'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['casual'] })
    expect(k1).toBe(k2)
  })

  it('different users → different keys (LAW 5 isolation)', () => {
    const k1 = hashRequestId('alice', 'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['casual'] })
    const k2 = hashRequestId('bob',   'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['casual'] })
    expect(k1).not.toBe(k2)
  })

  it('temperature bucketed — 20°C and 21°C → same key', () => {
    const k1 = hashRequestId('u1', 'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['casual'] })
    const k2 = hashRequestId('u1', 'casual', { temp: 21, condition: 'clear' }, { budget: 'mid', styles: ['casual'] })
    expect(k1).toBe(k2)
  })

  it('style array order does not affect key', () => {
    const k1 = hashRequestId('u1', 'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['casual', 'minimal'] })
    const k2 = hashRequestId('u1', 'casual', { temp: 20, condition: 'clear' }, { budget: 'mid', styles: ['minimal', 'casual'] })
    expect(k1).toBe(k2)
  })

  it('hashCacheKey: key-order independent', () => {
    const k1 = hashCacheKey({ a: 1, b: 2, c: 3 })
    const k2 = hashCacheKey({ c: 3, a: 1, b: 2 })
    expect(k1).toBe(k2)
  })
})

// ─────────────────────────────────────────────────────────────────
// LAW 6: Cost protection — no redundant AI calls
// ─────────────────────────────────────────────────────────────────

describe('LAW 6 — Cost Protection', () => {

  it('3 concurrent identical requests → Gemini called exactly once', async () => {
    let callCount = 0
    mockGemini.mockImplementation(async () => {
      callCount++
      await new Promise(r => setTimeout(r, 20))
      return VALID_OUTFIT
    })

    const orch = new AIOrchestrator({ geminiApiKey: 'k', openaiApiKey: 'k' })
    await Promise.all([
      orch.generateOutfit(BASE_INPUT, 'dedup-key', noCache, noSetCache),
      orch.generateOutfit(BASE_INPUT, 'dedup-key', noCache, noSetCache),
      orch.generateOutfit(BASE_INPUT, 'dedup-key', noCache, noSetCache),
    ])

    expect(callCount).toBe(1)
  })

  it('successful result written to cache exactly once', async () => {
    mockGemini.mockResolvedValue(VALID_OUTFIT)
    const setCache = jest.fn().mockResolvedValue(undefined)

    const orch = new AIOrchestrator({ geminiApiKey: 'k', openaiApiKey: 'k' })
    await orch.generateOutfit(BASE_INPUT, 'cache-write', noCache, setCache)

    expect(setCache).toHaveBeenCalledTimes(1)
  })

  it('degraded fallback NOT written to cache', async () => {
    mockGemini.mockRejectedValue(new Error('fail'))
    mockOpenAI.mockRejectedValue(new Error('fail'))
    const setCache = jest.fn()

    const orch = new AIOrchestrator({ geminiApiKey: 'k', openaiApiKey: 'k' })
    const result = await orch.generateOutfit(BASE_INPUT, 'no-cache-degraded', noCache, setCache)

    expect(result.data.confidenceScore).toBe(0.5)
    expect(setCache).not.toHaveBeenCalled()
  }, 20_000)
})

// ─────────────────────────────────────────────────────────────────
// AITrendOutput schema
// ─────────────────────────────────────────────────────────────────

describe('AITrendOutput — Schema Validation', () => {
  const VALID_TREND = {
    trends:    [{ trend: 'Linen blazers', description: 'Light and breathable', relevance: 0.9 }],
    location:  'New York',
    season:    'Summer',
    updatedAt: new Date().toISOString(),
  }

  it('accepts valid trend response',              () => { expect(AITrendOutputSchema.safeParse(VALID_TREND).success).toBe(true) })
  it('rejects missing trends array',              () => { const { trends: _, ...bad } = VALID_TREND; expect(AITrendOutputSchema.safeParse(bad).success).toBe(false) })
  it('rejects relevance > 1',                     () => { expect(AITrendOutputSchema.safeParse({ ...VALID_TREND, trends: [{ trend: 'x', description: 'y', relevance: 1.5 }] }).success).toBe(false) })
  it('rejects relevance < 0',                     () => { expect(AITrendOutputSchema.safeParse({ ...VALID_TREND, trends: [{ trend: 'x', description: 'y', relevance: -0.1 }] }).success).toBe(false) })
  it('rejects missing updatedAt',                 () => { const { updatedAt: _, ...bad } = VALID_TREND; expect(AITrendOutputSchema.safeParse(bad).success).toBe(false) })
})
