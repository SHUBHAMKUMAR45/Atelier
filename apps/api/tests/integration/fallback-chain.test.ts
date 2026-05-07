/**
 * Integration tests — AI Fallback Chain
 *
 * These tests mock the AI providers and verify the full
 * orchestrator fallback chain: Gemini → OpenAI → Cache → Degraded
 */

import { AIOrchestrator } from '../../../../packages/ai-core/src/orchestrator'
import type { OutfitGenerationInput } from '../../../../packages/ai-core/src/orchestrator'
import type { AIOutfitOutput } from '../../../../packages/shared/src/schemas'

// ─────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────

jest.mock('../../../../packages/ai-core/src/providers/gemini.provider')
jest.mock('../../../../packages/ai-core/src/providers/openai.provider')

import { GeminiProvider } from '../../../../packages/ai-core/src/providers/gemini.provider'
import { OpenAIProvider } from '../../../../packages/ai-core/src/providers/openai.provider'

const mockGeminiGenerate = jest.fn()
const mockOpenAIGenerate = jest.fn()

;(GeminiProvider as jest.Mock).mockImplementation(() => ({
  generateOutfit: mockGeminiGenerate,
  generateTrends: jest.fn(),
}))
;(OpenAIProvider as jest.Mock).mockImplementation(() => ({
  generateOutfit: mockOpenAIGenerate,
  generateTrends: jest.fn(),
}))

// ─────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────

const VALID_OUTPUT: AIOutfitOutput = {
  title:       'Test Outfit',
  description: 'A great outfit for testing',
  items: [
    {
      category: 'top', name: 'White Tee', description: 'Classic tee',
      color: 'White', style: 'casual', priceRange: 'mid',
      searchTerms: ['white tee'],
    },
    {
      category: 'bottom', name: 'Blue Jeans', description: 'Classic denim',
      color: 'Blue', style: 'casual', priceRange: 'mid',
      searchTerms: ['blue jeans'],
    },
    {
      category: 'shoes', name: 'Sneakers', description: 'White sneakers',
      color: 'White', style: 'casual', priceRange: 'mid',
      searchTerms: ['white sneakers'],
    },
  ],
  stylingTips:     ['Keep it simple'],
  colorPalette:    ['#FFFFFF', '#1a237e'],
  confidenceScore: 0.85,
}

const GENERATION_INPUT: OutfitGenerationInput = {
  occasion:    'casual',
  description: 'weekend brunch',
  weather:     { temp: 22, condition: 'sunny', humidity: 55, windSpeed: 8 },
  preferences: {
    styles:      ['casual'],
    colors:      ['#FFFFFF'],
    avoidColors: [],
    occasions:   ['casual'],
    budget:      'mid',
    gender:      'prefer-not-to-say',
  },
  measurements: { height: 175, weight: 70 },
  location:    'London',
  traceId:     'test-trace-001',
}

function makeOrchestrator() {
  return new AIOrchestrator({
    geminiApiKey: 'test-gemini-key',
    openaiApiKey: 'test-openai-key',
  })
}

const noCache   = () => Promise.resolve(null)
const noSetCache = () => Promise.resolve()

// ─────────────────────────────────────────────────────────────────
// FALLBACK CHAIN TESTS
// ─────────────────────────────────────────────────────────────────

describe('AIOrchestrator — Fallback Chain', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Scenario 1: Gemini succeeds ────────────────────────────────

  it('returns Gemini result when Gemini succeeds', async () => {
    mockGeminiGenerate.mockResolvedValue(VALID_OUTPUT)
    const orch   = makeOrchestrator()
    const result = await orch.generateOutfit(GENERATION_INPUT, 'key1', noCache, noSetCache)

    expect(result.provider).toBe('gemini')
    expect(result.data.title).toBe('Test Outfit')
    expect(mockOpenAIGenerate).not.toHaveBeenCalled()
  })

  // ── Scenario 2: Gemini fails → OpenAI succeeds ────────────────

  it('falls back to OpenAI when Gemini fails', async () => {
    mockGeminiGenerate.mockRejectedValue(new Error('Gemini API down'))
    mockOpenAIGenerate.mockResolvedValue(VALID_OUTPUT)

    const orch   = makeOrchestrator()
    const result = await orch.generateOutfit(GENERATION_INPUT, 'key2', noCache, noSetCache)

    expect(result.provider).toBe('openai')
    expect(mockOpenAIGenerate).toHaveBeenCalledTimes(1)
  })

  // ── Scenario 3: Both fail → cache hit ─────────────────────────

  it('returns cached result when both providers fail', async () => {
    mockGeminiGenerate.mockRejectedValue(new Error('Gemini down'))
    mockOpenAIGenerate.mockRejectedValue(new Error('OpenAI down'))

    const getCached = jest.fn().mockResolvedValue(VALID_OUTPUT)
    const orch      = makeOrchestrator()
    const result    = await orch.generateOutfit(GENERATION_INPUT, 'key3', getCached, noSetCache)

    expect(result.provider).toBe('cached')
    expect(result.data).toEqual(VALID_OUTPUT)
  })

  // ── Scenario 4: All fail → static degraded response ──────────

  it('returns degraded response when all providers and cache fail', async () => {
    mockGeminiGenerate.mockRejectedValue(new Error('Gemini down'))
    mockOpenAIGenerate.mockRejectedValue(new Error('OpenAI down'))
    const getCached = jest.fn().mockResolvedValue(null)

    const orch   = makeOrchestrator()
    const result = await orch.generateOutfit(GENERATION_INPUT, 'key4', getCached, noSetCache)

    expect(result.provider).toBe('cached')
    expect(result.data.items.length).toBeGreaterThanOrEqual(3)
    expect(result.data.confidenceScore).toBe(0.5)     // degraded marker
    // CRITICAL: system must NOT throw
  })

  // ── Scenario 5: Cache hit skips all providers ─────────────────

  it('returns cache immediately without calling any AI provider', async () => {
    const getCached = jest.fn().mockResolvedValue(VALID_OUTPUT)
    const orch      = makeOrchestrator()
    const result    = await orch.generateOutfit(GENERATION_INPUT, 'key5', getCached, noSetCache)

    expect(result.provider).toBe('cached')
    expect(mockGeminiGenerate).not.toHaveBeenCalled()
    expect(mockOpenAIGenerate).not.toHaveBeenCalled()
  })

  // ── Scenario 6: Gemini circuit opens after 5 failures ─────────

  it('opens Gemini circuit after repeated failures and routes to OpenAI', async () => {
    mockGeminiGenerate.mockRejectedValue(new Error('rate limit'))
    mockOpenAIGenerate.mockResolvedValue(VALID_OUTPUT)

    const orch = makeOrchestrator()

    // Trip the circuit breaker (5 failures = threshold)
    for (let i = 0; i < 5; i++) {
      await orch.generateOutfit(GENERATION_INPUT, `key-trip-${i}`, noCache, noSetCache)
    }

    const stats = orch.getCircuitStats()
    expect(stats.gemini.state).toBe('OPEN')

    // Next request should go straight to OpenAI
    mockGeminiGenerate.mockClear()
    mockOpenAIGenerate.mockClear()
    await orch.generateOutfit(GENERATION_INPUT, 'key-post-open', noCache, noSetCache)
    expect(mockGeminiGenerate).not.toHaveBeenCalled()
    expect(mockOpenAIGenerate).toHaveBeenCalledTimes(1)
  })

  // ── Scenario 7: Request deduplication ─────────────────────────

  it('deduplicates concurrent identical requests', async () => {
    let callCount = 0
    mockGeminiGenerate.mockImplementation(async () => {
      callCount++
      await new Promise(r => setTimeout(r, 50))
      return VALID_OUTPUT
    })

    const orch     = makeOrchestrator()
    const cacheKey = 'dedup-key'

    // Fire 5 concurrent requests with same key
    const results = await Promise.all([
      orch.generateOutfit(GENERATION_INPUT, cacheKey, noCache, noSetCache),
      orch.generateOutfit(GENERATION_INPUT, cacheKey, noCache, noSetCache),
      orch.generateOutfit(GENERATION_INPUT, cacheKey, noCache, noSetCache),
      orch.generateOutfit(GENERATION_INPUT, cacheKey, noCache, noSetCache),
      orch.generateOutfit(GENERATION_INPUT, cacheKey, noCache, noSetCache),
    ])

    // All should return the same data
    expect(results.every(r => r.data.title === 'Test Outfit')).toBe(true)
    // But AI was called ONLY ONCE
    expect(callCount).toBe(1)
  })

  // ── Scenario 8: setCached called on Gemini success ────────────

  it('calls setCached after successful Gemini call', async () => {
    mockGeminiGenerate.mockResolvedValue(VALID_OUTPUT)
    const setCached = jest.fn().mockResolvedValue(undefined)

    const orch = makeOrchestrator()
    await orch.generateOutfit(GENERATION_INPUT, 'key-set', noCache, setCached)

    expect(setCached).toHaveBeenCalledWith(VALID_OUTPUT)
  })

  // ── Scenario 9: setCached NOT called on degraded fallback ──────

  it('does NOT call setCached for degraded static response', async () => {
    mockGeminiGenerate.mockRejectedValue(new Error('down'))
    mockOpenAIGenerate.mockRejectedValue(new Error('down'))
    const getCached  = jest.fn().mockResolvedValue(null)
    const setCached  = jest.fn()

    const orch = makeOrchestrator()
    await orch.generateOutfit(GENERATION_INPUT, 'key-degraded', getCached, setCached)

    expect(setCached).not.toHaveBeenCalled()
  })

  // ── Scenario 10: Latency measured correctly ────────────────────

  it('reports latencyMs in result', async () => {
    mockGeminiGenerate.mockImplementation(
      () => new Promise(r => setTimeout(() => r(VALID_OUTPUT), 50)),
    )
    const orch   = makeOrchestrator()
    const result = await orch.generateOutfit(GENERATION_INPUT, 'key-lat', noCache, noSetCache)

    expect(result.latencyMs).toBeGreaterThanOrEqual(40)
  })
})
