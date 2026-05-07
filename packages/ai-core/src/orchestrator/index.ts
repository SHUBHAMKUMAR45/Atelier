import { CircuitBreaker, CircuitOpenError, withRetry } from '../circuit-breaker'
import { GeminiProvider }  from '../providers/gemini.provider'
import { OpenAIProvider }  from '../providers/openai.provider'
import { AIOutfitOutputSchema, AITrendOutputSchema } from '../../../shared/src/schemas'
import type {
  AIOutfitOutput,
  AITrendOutput,
  WeatherContext,
  UserPreferences,
  WardrobeItem,
} from '../../../shared/src/schemas'
import { sanitizeUserInput } from '../../../shared/src/utils'

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface OrchestratorConfig {
  geminiApiKey: string
  openaiApiKey: string
  geminiModel?: string
  openaiModel?: string
}

export interface OutfitGenerationInput {
  occasion:    string
  description: string | undefined
  weather:     WeatherContext
  preferences: UserPreferences
  measurements: { height: number; weight: number; chest?: number; waist?: number; hips?: number } | undefined
  location:    string
  traceId:     string
  wardrobe?:   WardrobeItem[]
}

export interface TrendGenerationInput {
  location: string
  season:   string
  traceId:  string
}

export type AIProvider = 'gemini' | 'openai' | 'cached'

export interface OrchestratorResult<T> {
  data:      T
  provider:  AIProvider
  latencyMs: number
}

// ─────────────────────────────────────────────────────────────────
// IN-FLIGHT DEDUPLICATION
// ─────────────────────────────────────────────────────────────────

const inFlight = new Map<string, Promise<unknown>>()

async function deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>
  const promise = fn().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}

// ─────────────────────────────────────────────────────────────────
// ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────

export class AIOrchestrator {
  private readonly gemini:   GeminiProvider
  private readonly openai:   OpenAIProvider
  private readonly cbGemini: CircuitBreaker
  private readonly cbOpenAI: CircuitBreaker

  constructor(config: OrchestratorConfig) {
    this.gemini = new GeminiProvider({ apiKey: config.geminiApiKey, ...(config.geminiModel ? { model: config.geminiModel } : {}) })
    this.openai = new OpenAIProvider({ apiKey: config.openaiApiKey, ...(config.openaiModel ? { model: config.openaiModel } : {}) })
    this.cbGemini = new CircuitBreaker('gemini', { failureThreshold: 5, cooldownMs: 120_000, requestTimeout: 25_000 })
    this.cbOpenAI = new CircuitBreaker('openai', { failureThreshold: 5, cooldownMs: 120_000, requestTimeout: 25_000 })
  }

  async generateOutfit(
    input:      OutfitGenerationInput,
    cacheKey:   string,
    getCached:  () => Promise<AIOutfitOutput | null>,
    setCached:  (data: AIOutfitOutput) => Promise<void>,
  ): Promise<OrchestratorResult<AIOutfitOutput>> {
    const result = await deduplicate(cacheKey, () => this._generateOutfit(input, cacheKey, getCached, setCached))
    return result as OrchestratorResult<AIOutfitOutput>
  }

  private async _generateOutfit(
    input:     OutfitGenerationInput,
    cacheKey:  string,
    getCached: () => Promise<AIOutfitOutput | null>,
    setCached: (data: AIOutfitOutput) => Promise<void>,
  ): Promise<OrchestratorResult<AIOutfitOutput>> {
    const start = Date.now()

    const cached = await getCached()
    if (cached) return { data: cached, provider: 'cached', latencyMs: Date.now() - start }

    const prompt = buildOutfitPrompt(input)
    const timeoutThreshold = 2500 // 2.5s staggered trigger

    const executeProvider = async (
      provider: 'gemini' | 'openai', 
      cb: CircuitBreaker, 
      genFn: (p: string) => Promise<unknown>
    ): Promise<OrchestratorResult<AIOutfitOutput>> => {
      if (!cb.isAvailable()) throw new Error(`Provider ${provider} unavailable`)
      const raw  = await withRetry(() => cb.execute(() => genFn(prompt)), { maxAttempts: 2, baseDelayMs: 500 })
      const data = AIOutfitOutputSchema.parse(raw)
      await setCached(data)
      return { data, provider, latencyMs: Date.now() - start }
    }

    // Cancellation flag — prevents OpenAI from firing if Gemini wins first
    let cancelled = false
    let openaiTimerHandle: ReturnType<typeof setTimeout> | null = null

    const geminiTask = executeProvider('gemini', this.cbGemini, (p) => this.gemini.generateOutfit(p))

    // OpenAI only starts after 2.5s, and only if Gemini hasn't won yet
    const openaiTrigger = new Promise<OrchestratorResult<AIOutfitOutput>>((resolve, reject) => {
      openaiTimerHandle = setTimeout(() => {
        if (cancelled) return  // Gemini already won — skip OpenAI entirely
        executeProvider('openai', this.cbOpenAI, (p) => this.openai.generateOutfit(p))
          .then(resolve)
          .catch(reject)
      }, timeoutThreshold)
    })

    try {
      const winner = await Promise.race([geminiTask, openaiTrigger])
      // Cancel any pending OpenAI call
      cancelled = true
      if (openaiTimerHandle !== null) clearTimeout(openaiTimerHandle)
      return winner
    } catch (err) {
      cancelled = true
      if (openaiTimerHandle !== null) clearTimeout(openaiTimerHandle)

      if (err instanceof CircuitOpenError) { /* ignore and try final fallback */ }

      // Final attempt: try both sequentially
      try {
        return await geminiTask
      } catch {
        try {
          return await executeProvider('openai', this.cbOpenAI, (p) => this.openai.generateOutfit(p))
        } catch {
          const fallback = await getCached()
          if (fallback) return { data: fallback, provider: 'cached', latencyMs: Date.now() - start }
          return { data: buildDegradedOutfitResponse(input), provider: 'cached', latencyMs: Date.now() - start }
        }
      }
    }
  }

  async generateTrends(
    input:     TrendGenerationInput,
    cacheKey:  string,
    getCached: () => Promise<AITrendOutput | null>,
    setCached: (data: AITrendOutput) => Promise<void>,
  ): Promise<OrchestratorResult<AITrendOutput>> {
    const result = await deduplicate(cacheKey, () => this._generateTrends(input, cacheKey, getCached, setCached))
    return result as OrchestratorResult<AITrendOutput>
  }

  private async _generateTrends(
    input:     TrendGenerationInput,
    cacheKey:  string,
    getCached: () => Promise<AITrendOutput | null>,
    setCached: (data: AITrendOutput) => Promise<void>,
  ): Promise<OrchestratorResult<AITrendOutput>> {
    const start = Date.now()
    const cached = await getCached()
    if (cached) return { data: cached, provider: 'cached', latencyMs: Date.now() - start }

    const prompt = buildTrendPrompt(input)

    if (this.cbGemini.isAvailable()) {
      try {
        const raw  = await withRetry(() => this.cbGemini.execute(() => this.gemini.generateTrends(prompt)), { maxAttempts: 2 })
        const data = AITrendOutputSchema.parse(raw)
        await setCached(data)
        return { data, provider: 'gemini', latencyMs: Date.now() - start }
      } catch { /* fallthrough */ }
    }

    if (this.cbOpenAI.isAvailable()) {
      try {
        const raw  = await withRetry(() => this.cbOpenAI.execute(() => this.openai.generateTrends(prompt)), { maxAttempts: 2 })
        const data = AITrendOutputSchema.parse(raw)
        await setCached(data)
        return { data, provider: 'openai', latencyMs: Date.now() - start }
      } catch { /* fallthrough */ }
    }

    return { data: buildDegradedTrendResponse(input), provider: 'cached', latencyMs: Date.now() - start }
  }

  getCircuitStats() {
    return { gemini: this.cbGemini.getStats(), openai: this.cbOpenAI.getStats() }
  }
}

// ─────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────

function buildOutfitPrompt(input: OutfitGenerationInput): string {
  const safe = sanitizeUserInput({
    occasion:    input.occasion,
    description: input.description ?? '',
    location:    input.location,
  }) as { occasion: string; description: string; location: string }

  const mStr = input.measurements
    ? `Height: ${input.measurements.height}cm, Weight: ${input.measurements.weight}kg`
    : 'not provided'

  return `Generate a complete outfit recommendation.
Occasion: ${safe.occasion}
Notes: ${safe.description || 'none'}
Location: ${safe.location}
Weather: ${input.weather.temp}°C, ${input.weather.condition}, Humidity ${input.weather.humidity}%
Gender: ${input.preferences.gender}
Body: ${mStr}
Budget: ${input.preferences.budget}
Styles: ${input.preferences.styles.join(', ')}
Colors liked: ${input.preferences.colors.join(', ') || 'any'}
Colors to avoid: ${input.preferences.avoidColors.join(', ') || 'none'}

User's Wardrobe:
${input.wardrobe?.length 
    ? input.wardrobe.map(i => `- ${i.category}: ${i.name} (${i.color || 'unknown color'})`).join('\n')
    : 'No items in wardrobe yet.'}

Instructions:
1. If suitable wardrobe items exist, incorporate at least one or two into the recommendation to make use of owned clothes.
2. Suggest 1 or 2 new items that complement the wardrobe items to complete the look.
3. If no suitable wardrobe items exist, suggest a complete new outfit.

Return ONLY valid JSON.`.trim()
}

function buildTrendPrompt(input: TrendGenerationInput): string {
  const safe = sanitizeUserInput({ location: input.location }) as { location: string }
  return `Fashion trends for: ${safe.location}\nSeason: ${input.season}\nReturn ONLY valid JSON.`
}

// ─────────────────────────────────────────────────────────────────
// DEGRADED RESPONSES
// ─────────────────────────────────────────────────────────────────

function buildDegradedOutfitResponse(input: OutfitGenerationInput): AIOutfitOutput {
  const budget = input.preferences.budget
  return {
    title: 'Classic Everyday Outfit',
    description: 'A timeless, versatile outfit suitable for your occasion.',
    items: [
      { category: 'top',    name: 'Classic Crew Neck T-Shirt', description: 'A comfortable basic.', color: 'White',      material: 'Cotton', style: 'casual', priceRange: budget, searchTerms: ['white crew neck t-shirt'] },
      { category: 'bottom', name: 'Well-Fitted Jeans',         description: 'Classic straight-fit.', color: 'Indigo Blue', material: 'Denim',  style: 'casual', priceRange: budget, searchTerms: ['straight fit jeans'] },
      { category: 'shoes',  name: 'White Sneakers',            description: 'Clean minimal sneakers.', color: 'White',    material: 'Leather', style: 'casual', priceRange: budget, searchTerms: ['white leather sneakers'] },
    ],
    stylingTips:     ['Keep accessories minimal for a clean look'],
    colorPalette:    ['#FFFFFF', '#1a237e', '#f5f5f5'],
    confidenceScore: 0.5,
  }
}

function buildDegradedTrendResponse(input: TrendGenerationInput): AITrendOutput {
  return {
    trends: [
      { trend: 'Minimalist Basics', description: 'Clean simple pieces easy to mix and match.', relevance: 0.8 },
      { trend: 'Earth Tones',       description: 'Warm browns, tans, and olive greens.', relevance: 0.7 },
    ],
    location:  input.location,
    season:    input.season,
    updatedAt: new Date().toISOString(),
  }
}
