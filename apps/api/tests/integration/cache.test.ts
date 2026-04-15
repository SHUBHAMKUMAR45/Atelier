/**
 * Integration tests — AI Cache Service
 *
 * Tests TTL expiry, hit counting, upsert behavior, and
 * cache miss → set → hit lifecycle.
 */

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { AICacheService }    from '../../src/services/cache.service'
import type { AIOutfitOutput } from '../../../../packages/shared/src/schemas'

let mongoServer: MongoMemoryServer
let cache: AICacheService

const MOCK_OUTFIT: AIOutfitOutput = {
  title:           'Cache Test Outfit',
  description:     'An outfit stored in cache',
  items: [
    {
      category: 'top',    name: 'Tee',     description: 'A tee', color: 'White',
      style: 'casual',    priceRange: 'mid', searchTerms: ['tee'],
    },
    {
      category: 'bottom', name: 'Jeans',   description: 'Denim', color: 'Blue',
      style: 'casual',    priceRange: 'mid', searchTerms: ['jeans'],
    },
    {
      category: 'shoes',  name: 'Sneakers',description: 'Clean', color: 'White',
      style: 'casual',    priceRange: 'mid', searchTerms: ['sneakers'],
    },
  ],
  stylingTips:     ['Keep it clean'],
  colorPalette:    ['#FFFFFF', '#1a237e'],
  confidenceScore: 0.9,
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri(), { dbName: 'test' })
  cache = new AICacheService()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

beforeEach(async () => {
  await mongoose.connection.collection('ai_cache').deleteMany({})
})

// ─────────────────────────────────────────────────────────────────
// CACHE MISS → SET → HIT LIFECYCLE
// ─────────────────────────────────────────────────────────────────

describe('AICacheService — Lifecycle', () => {
  it('returns null on cache miss', async () => {
    const result = await cache.getOutfit('missing-key')
    expect(result).toBeNull()
  })

  it('returns data after set', async () => {
    await cache.setOutfit('key-001', MOCK_OUTFIT)
    const result = await cache.getOutfit('key-001')
    expect(result).toMatchObject({ title: 'Cache Test Outfit' })
  })

  it('increments hitCount on each get', async () => {
    await cache.setOutfit('key-hitcount', MOCK_OUTFIT)

    await cache.getOutfit('key-hitcount')
    await cache.getOutfit('key-hitcount')
    await cache.getOutfit('key-hitcount')

    const doc = await mongoose.connection
      .collection('ai_cache')
      .findOne({ cacheKey: 'key-hitcount' })

    expect(doc?.hitCount).toBe(3)
  })

  it('upserts without duplicate on repeated set', async () => {
    await cache.setOutfit('key-upsert', MOCK_OUTFIT)
    await cache.setOutfit('key-upsert', { ...MOCK_OUTFIT, title: 'Updated' })

    const count = await mongoose.connection
      .collection('ai_cache')
      .countDocuments({ cacheKey: 'key-upsert' })

    const doc = await mongoose.connection
      .collection('ai_cache')
      .findOne({ cacheKey: 'key-upsert' })

    expect(count).toBe(1)
    expect((doc?.response as { title: string })?.title).toBe('Updated')
  })

  it('returns null for expired entry (simulated TTL)', async () => {
    // Manually insert an already-expired entry
    await mongoose.connection.collection('ai_cache').insertOne({
      cacheKey:     'key-expired',
      requestType:  'outfit',
      response:     MOCK_OUTFIT,
      ttlExpiresAt: new Date(Date.now() - 1_000),   // 1 second in the past
      hitCount:     0,
      createdAt:    new Date(),
    })

    const result = await cache.getOutfit('key-expired')
    expect(result).toBeNull()
  })

  it('does not fail when set throws (non-fatal)', async () => {
    // Disconnect to simulate DB error
    const origFind = mongoose.connection.collection
    jest.spyOn(mongoose.connection, 'collection').mockImplementationOnce(() => {
      throw new Error('DB error')
    })

    // Should not throw — cache set is non-fatal
    await expect(cache.setOutfit('key-error', MOCK_OUTFIT)).resolves.not.toThrow()

    jest.restoreAllMocks()
  })
})

// ─────────────────────────────────────────────────────────────────
// WEATHER CACHE
// ─────────────────────────────────────────────────────────────────

describe('Weather Cache', () => {
  it('caches and retrieves weather data', async () => {
    const weather = { temp: 22, condition: 'sunny', humidity: 55, windSpeed: 8 }
    await cache.setWeather('weather-london', weather)
    const result = await cache.getWeather('weather-london')
    expect(result).toEqual(weather)
  })

  it('returns null for missing weather cache', async () => {
    expect(await cache.getWeather('weather-missing')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────
// TRENDS CACHE
// ─────────────────────────────────────────────────────────────────

describe('Trends Cache', () => {
  it('caches and retrieves trends', async () => {
    const trends = {
      trends:    [{ trend: 'Minimalism', description: 'Less is more', relevance: 0.9 }],
      location:  'London',
      season:    'Summer',
      updatedAt: new Date().toISOString(),
    }
    await cache.setTrends('trends-london', trends)
    const result = await cache.getTrends('trends-london')
    expect(result?.trends[0]?.trend).toBe('Minimalism')
  })
})
