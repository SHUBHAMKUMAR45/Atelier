import { AICacheModel } from '../db/models'
import { addHours, addMinutes } from '../../../../packages/shared/src/utils'
import { logger } from '../config/logger'
import type { AIOutfitOutput, AITrendOutput } from '../../../../packages/shared/src/schemas'

// ─────────────────────────────────────────────────────────────────
// TTL CONFIG
// ─────────────────────────────────────────────────────────────────

const TTL = {
  outfit:  6,        // hours
  trend:   24,       // hours
  weather: 30,       // minutes
} as const

// ─────────────────────────────────────────────────────────────────
// CACHE SERVICE
// ─────────────────────────────────────────────────────────────────

export class AICacheService {
  // ── Outfit ──────────────────────────────────────────────────────

  async getOutfit(cacheKey: string): Promise<AIOutfitOutput | null> {
    try {
      const entry = await AICacheModel.findOneAndUpdate(
        { cacheKey, requestType: 'outfit', ttlExpiresAt: { $gt: new Date() } },
        { $inc: { hitCount: 1 } },
        { new: true },
      ).lean()

      if (entry) {
        logger.debug({ cacheKey }, 'Cache HIT: outfit')
        return entry.response as AIOutfitOutput
      }

      logger.debug({ cacheKey }, 'Cache MISS: outfit')
      return null
    } catch (err) {
      logger.error({ err, cacheKey }, 'Cache get error — treating as miss')
      return null
    }
  }

  async setOutfit(cacheKey: string, data: AIOutfitOutput): Promise<void> {
    try {
      await AICacheModel.findOneAndUpdate(
        { cacheKey },
        {
          $set: {
            requestType:  'outfit',
            response:     data,
            ttlExpiresAt: addHours(new Date(), TTL.outfit),
          },
          $setOnInsert: { hitCount: 0 },
        },
        { upsert: true },
      )
    } catch (err) {
      logger.error({ err, cacheKey }, 'Cache set error — non-fatal')
    }
  }

  // ── Trends ──────────────────────────────────────────────────────

  async getTrends(cacheKey: string): Promise<AITrendOutput | null> {
    try {
      const entry = await AICacheModel.findOneAndUpdate(
        { cacheKey, requestType: 'trend', ttlExpiresAt: { $gt: new Date() } },
        { $inc: { hitCount: 1 } },
        { new: true },
      ).lean()

      if (entry) {
        logger.debug({ cacheKey }, 'Cache HIT: trends')
        return entry.response as AITrendOutput
      }

      logger.debug({ cacheKey }, 'Cache MISS: trends')
      return null
    } catch (err) {
      logger.error({ err, cacheKey }, 'Cache get trends error')
      return null
    }
  }

  async setTrends(cacheKey: string, data: AITrendOutput): Promise<void> {
    try {
      await AICacheModel.findOneAndUpdate(
        { cacheKey },
        {
          $set: {
            requestType:  'trend',
            response:     data,
            ttlExpiresAt: addHours(new Date(), TTL.trend),
          },
          $setOnInsert: { hitCount: 0 },
        },
        { upsert: true },
      )
    } catch (err) {
      logger.error({ err, cacheKey }, 'Cache set trends error — non-fatal')
    }
  }

  // ── Weather ─────────────────────────────────────────────────────

  async getWeather(cacheKey: string): Promise<unknown | null> {
    try {
      const entry = await AICacheModel.findOne({
        cacheKey,
        requestType:  'weather',
        ttlExpiresAt: { $gt: new Date() },
      }).lean()

      return entry?.response ?? null
    } catch (err) {
      logger.error({ err, cacheKey }, 'Weather cache get error')
      return null
    }
  }

  async setWeather(cacheKey: string, data: unknown): Promise<void> {
    try {
      await AICacheModel.findOneAndUpdate(
        { cacheKey },
        {
          $set: {
            requestType:  'weather',
            response:     data,
            ttlExpiresAt: addMinutes(new Date(), TTL.weather),
          },
          $setOnInsert: { hitCount: 0 },
        },
        { upsert: true },
      )
    } catch (err) {
      logger.error({ err, cacheKey }, 'Weather cache set error — non-fatal')
    }
  }
}

export const cacheService = new AICacheService()
