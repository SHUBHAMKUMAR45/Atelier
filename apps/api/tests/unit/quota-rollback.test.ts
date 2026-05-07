/**
 * QUOTA ROLLBACK TESTS
 * Validates that user quota is NEVER consumed unless the recommendation
 * is successfully saved to the database.
 * 
 * Chaos scenario: AI returns valid response BUT database write fails.
 * Expected: quota rolled back, user keeps their daily credit.
 */

// ── Mocks ──────────────────────────────────────────────────────────

jest.mock('../../src/config/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn(),
    child: jest.fn().mockReturnValue({ info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() }) },
  createLogger: () => ({ info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() }),
  createRequestLogger: jest.fn().mockReturnValue({ info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() }),
}))

jest.mock('../../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    MONGODB_DB_NAME: 'test',
    CLERK_SECRET_KEY: 'test',
    CLERK_WEBHOOK_SECRET: 'test',
    GEMINI_API_KEY: 'test',
    GEMINI_MODEL: 'gemini-1.5-flash',
    OPENAI_API_KEY: 'test',
    OPENAI_MODEL: 'gpt-4o-mini',
    REPLICATE_API_TOKEN: 'test',
    CLOUDINARY_CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'test',
    CLOUDINARY_API_SECRET: 'test',
    WEATHER_API_KEY: 'test',
    DAILY_QUOTA_LIMIT: 5,
    GLOBAL_RATE_LIMIT_RPM: 100,
    CACHE_TTL_TEXT_HOURS: 6,
    CACHE_TTL_TREND_HOURS: 24,
    CACHE_TTL_WEATHER_MINS: 30,
    ALLOWED_ORIGINS: 'http://localhost:3000',
    LOG_LEVEL: 'silent',
    ADMIN_METRICS_TOKEN: 'test',
    PORT: 4000,
  },
}))

const mockGetProfile    = jest.fn()
const mockGetQuotaStatus = jest.fn()
const mockConsumeQuota  = jest.fn()
const mockRollbackQuota = jest.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('../../src/services/profile.service', () => ({
  profileService: {
    getProfile:     (...a: unknown[]) => mockGetProfile(...a),
    getQuotaStatus: (...a: unknown[]) => mockGetQuotaStatus(...a),
    consumeQuota:   (...a: unknown[]) => mockConsumeQuota(...a),
    rollbackQuota:  (...a: unknown[]) => mockRollbackQuota(...a),
  },
}))

const mockFindByHash    = jest.fn()
const mockCreate        = jest.fn()
jest.mock('../../src/repositories/recommendation.repository', () => ({
  recommendationRepository: {
    findByHash: (...a: unknown[]) => mockFindByHash(...a),
    create:     (...a: unknown[]) => mockCreate(...a),
  },
}))

const mockGetWeather          = jest.fn()
const mockGetSeasonalFallback = jest.fn()
jest.mock('../../src/services/weather.service', () => ({
  weatherService: {
    getWeather:          (...a: unknown[]) => mockGetWeather(...a),
    getSeasonalFallback: () => mockGetSeasonalFallback(),
  },
}))

jest.mock('../../src/services/wardrobe.service', () => ({
  wardrobeService: { getItems: jest.fn().mockResolvedValue([]) },
}))

const mockCacheGet = jest.fn()
const mockCacheSet = jest.fn()
jest.mock('../../src/services/cache.service', () => ({
  cacheService: {
    getOutfit: (...a: unknown[]) => mockCacheGet(...a),
    setOutfit: (...a: unknown[]) => mockCacheSet(...a),
  },
}))

const mockGenerateOutfit = jest.fn()
jest.mock('../../../../packages/ai-core/src/orchestrator', () => ({
  AIOrchestrator: jest.fn().mockImplementation(() => ({
    generateOutfit: (...a: unknown[]) => mockGenerateOutfit(...a),
  })),
}))

jest.mock('../../src/utils/metrics', () => ({
  metrics: {
    quotaExceeded:       { inc: jest.fn() },
    aiRequestDuration:   { observe: jest.fn() },
    recommendationsGenerated: { inc: jest.fn() },
  },
}))

jest.mock('../../src/utils/sanitize', () => ({
  sanitizeForAIPrompt: (s: string) => s,
}))

// ── Test suite ──────────────────────────────────────────────────────

import { RecommendationService } from '../../src/services/recommendation.service'

const MOCK_PROFILE = {
  clerkUserId: 'user_test',
  email: 'test@test.com',
  displayName: 'Test User',
  preferences: {
    styles: ['casual'],
    colors: [],
    avoidColors: [],
    occasions: ['casual'],
    budget: 'mid',
    gender: 'prefer-not-to-say',
  },
  measurements: null,
  location: null,
  dailyQuota: { date: new Date().toISOString().split('T')[0], count: 0 },
}

const MOCK_WEATHER = {
  temp: 18,
  feelsLike: 17,
  humidity: 65,
  windSpeed: 10,
  condition: 'Partly Cloudy',
  icon: '02d',
  location: 'Paris',
  country: 'FR',
  sunrise: '06:00',
  sunset: '20:00',
}

const MOCK_AI_RESULT = {
  provider: 'gemini',
  latencyMs: 1200,
  data: {
    title: 'Test Outfit',
    description: 'A test outfit',
    items: [
      { name: 'White Shirt', category: 'top', color: '#FFF', description: 'Classic', style: 'casual', material: 'Cotton', priceRange: '$20-40' },
      { name: 'Dark Jeans', category: 'bottom', color: '#333', description: 'Slim fit', style: 'casual', material: 'Denim', priceRange: '$50-80' },
    ],
    colorPalette: ['#FFFFFF', '#333333'],
    stylingTips: ['Test tip'],
    confidenceScore: 0.85,
    occasionFit: 0.9,
  },
}

describe('Quota Rollback Safety', () => {
  let service: RecommendationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new RecommendationService()

    mockGetProfile.mockResolvedValue(MOCK_PROFILE)
    mockGetQuotaStatus.mockResolvedValue({ used: 0, limit: 5, remaining: 5, resetAt: '2026-04-20' })
    mockConsumeQuota.mockResolvedValue(true)
    mockRollbackQuota.mockResolvedValue(undefined)
    mockFindByHash.mockResolvedValue(null)
    mockGetSeasonalFallback.mockReturnValue(MOCK_WEATHER)
    mockCacheGet.mockResolvedValue(null)
    mockCacheSet.mockResolvedValue(undefined)
    mockGenerateOutfit.mockResolvedValue(MOCK_AI_RESULT)
  })

  it('consumes quota and returns recommendation on success', async () => {
    const saved = { _id: 'rec_001', ...MOCK_AI_RESULT.data, userId: 'user_test', occasion: 'casual', weatherContext: MOCK_WEATHER, imageStatus: 'pending', feedback: {} }
    mockCreate.mockResolvedValue(saved)

    const result = await service.generate('user_test', { occasion: 'casual', useWardrobe: false }, 'trace_001')

    expect(mockConsumeQuota).toHaveBeenCalledWith('user_test')
    expect(mockRollbackQuota).not.toHaveBeenCalled()
    expect(result._id).toBe('rec_001')
  })

  it('rolls back quota when AI generation throws', async () => {
    mockGenerateOutfit.mockRejectedValue(new Error('Gemini API timeout'))

    await expect(
      service.generate('user_test', { occasion: 'casual', useWardrobe: false }, 'trace_002')
    ).rejects.toThrow('Gemini API timeout')

    expect(mockConsumeQuota).toHaveBeenCalledWith('user_test')
    expect(mockRollbackQuota).toHaveBeenCalledWith('user_test')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rolls back quota when DB save fails after successful AI response', async () => {
    // AI succeeds — DB write fails
    mockCreate.mockRejectedValue(new Error('MongoDB write concern failed'))

    await expect(
      service.generate('user_test', { occasion: 'casual', useWardrobe: false }, 'trace_003')
    ).rejects.toThrow('MongoDB write concern failed')

    // Quota MUST be rolled back even though AI completed successfully
    expect(mockConsumeQuota).toHaveBeenCalledWith('user_test')
    expect(mockRollbackQuota).toHaveBeenCalledWith('user_test')
    expect(mockGenerateOutfit).toHaveBeenCalled()
  })

  it('does not consume quota when quota check shows 0 remaining', async () => {
    mockGetQuotaStatus.mockResolvedValue({ used: 5, limit: 5, remaining: 0, resetAt: '2026-04-20' })

    await expect(
      service.generate('user_test', { occasion: 'casual', useWardrobe: false }, 'trace_004')
    ).rejects.toThrow('Daily recommendation limit reached')

    expect(mockConsumeQuota).not.toHaveBeenCalled()
    expect(mockGenerateOutfit).not.toHaveBeenCalled()
  })

  it('propagates original AI error even when rollback itself throws', async () => {
    // Best-effort rollback: if rollback fails, original error is still thrown
    mockGenerateOutfit.mockRejectedValue(new Error('AI network error'))
    mockRollbackQuota.mockRejectedValue(new Error('Rollback DB also down'))

    // Original AI error must propagate (rollback failure is logged, not re-thrown)
    await expect(
      service.generate('user_test', { occasion: 'casual', useWardrobe: false }, 'trace_005')
    ).rejects.toThrow('AI network error')

    expect(mockRollbackQuota).toHaveBeenCalledWith('user_test')
  })

  it('returns idempotent result without consuming quota for duplicate request hash', async () => {
    const existing = { _id: 'rec_existing', userId: 'user_test' }
    mockFindByHash.mockResolvedValue(existing)

    const result = await service.generate('user_test', { occasion: 'casual', useWardrobe: false }, 'trace_006')

    expect(result._id).toBe('rec_existing')
    expect(mockConsumeQuota).not.toHaveBeenCalled()
    expect(mockGenerateOutfit).not.toHaveBeenCalled()
  })
})
