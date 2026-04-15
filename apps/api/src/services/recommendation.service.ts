import { RecommendationModel }   from '../db/models'
import { AIOrchestrator }        from '../../../../packages/ai-core/src/orchestrator'
import { cacheService }          from './cache.service'
import { weatherService }        from './weather.service'
import { profileService }        from './profile.service'
import { wardrobeService }       from './wardrobe.service'
import { hashRequestId, addDays } from '../../../../packages/shared/src/utils'
import { logger }                from '../config/logger'
import { env }                   from '../config/env'
import { metrics }               from '../utils/metrics'
import { sanitizeForAIPrompt }    from '../utils/sanitize'
import type {
  OutfitRecommendation,
  RecommendRequest,
  Outfit,
} from '../../../../packages/shared/src/schemas'

let orchestrator: AIOrchestrator | null = null

function getOrchestrator(): AIOrchestrator {
  if (!orchestrator) {
    orchestrator = new AIOrchestrator({
      geminiApiKey: env.GEMINI_API_KEY,
      openaiApiKey: env.OPENAI_API_KEY,
      geminiModel:  env.GEMINI_MODEL,
      openaiModel:  env.OPENAI_MODEL,
    })
  }
  return orchestrator
}

// ─────────────────────────────────────────────────────────────────

export class RecommendationService {
  async generate(
    clerkUserId: string,
    request:     RecommendRequest,
    traceId:     string,
  ): Promise<OutfitRecommendation> {
    const requestLogger = logger.child({ traceId, userId: clerkUserId })

    const profile = await profileService.getProfile(clerkUserId)
    if (!profile) throw new ProfileNotFoundError()
    if (!profile.preferences) throw new ProfileIncompleteError('preferences')

    const quotaOk = await profileService.consumeQuota(clerkUserId)
    if (!quotaOk) {
      metrics.quotaExceeded.inc()
      throw new QuotaExceededError()
    }

    const locationCoords = request.location ?? profile.location ?? null
    const weather = locationCoords
      ? await weatherService.getWeather(locationCoords.lat, locationCoords.lon)
      : weatherService.getSeasonalFallback()

    const requestHash = hashRequestId(
      clerkUserId,
      request.occasion,
      { temp: weather.temp, condition: weather.condition },
      { budget: profile.preferences.budget, styles: profile.preferences.styles },
      request.useWardrobe, // Add to hash for distinct cache
    )

    // Fetch wardrobe if requested
    const wardrobe = request.useWardrobe 
      ? await wardrobeService.getItems(clerkUserId)
      : undefined

    // Idempotency check
    const existing = await RecommendationModel
      .findOne({ requestHash, userId: clerkUserId })
      .lean()
    if (existing) {
      requestLogger.info({ requestHash }, 'Returning idempotent recommendation')
      return this.mapToRecommendation(existing)
    }

    // Sanitize user-supplied description before AI
    const sanitizedDescription = request.description
      ? sanitizeForAIPrompt(request.description)
      : undefined

    const aiStart = Date.now()
    const result  = await getOrchestrator().generateOutfit(
      {
        occasion:    request.occasion,
        description: sanitizedDescription,
        weather,
        preferences: profile.preferences,
        measurements: profile.measurements
          ? {
              height: profile.measurements.height,
              weight: profile.measurements.weight,
              ...(profile.measurements.chest !== undefined ? { chest: profile.measurements.chest } : {}),
              ...(profile.measurements.waist !== undefined ? { waist: profile.measurements.waist } : {}),
              ...(profile.measurements.hips  !== undefined ? { hips:  profile.measurements.hips  } : {}),
            }
          : undefined,
        location: profile.location?.city ?? 'unknown',
        traceId,
        wardrobe,
      },
      requestHash,
      () => cacheService.getOutfit(requestHash),
      (data) => cacheService.setOutfit(requestHash, data),
    )

    // Track AI metrics
    metrics.aiRequestDuration.observe(
      { provider: result.provider, operation: 'outfit' },
      (Date.now() - aiStart) / 1000,
    )
    metrics.recommendationsGenerated.inc({
      provider:  result.provider,
      cache_hit: String(result.provider === 'cached'),
      occasion:  request.occasion,
    })

    requestLogger.info({
      requestHash,
      provider:  result.provider,
      latencyMs: result.latencyMs,
      cacheHit:  result.provider === 'cached',
    }, 'AI generation complete')

    const recommendation = {
      userId:         clerkUserId,
      requestHash,
      occasion:       request.occasion,
      weatherContext: weather,
      outfit:         result.data,
      imageStatus:    'pending' as const,
      aiProvider:     result.provider,
      cacheHit:       result.provider === 'cached',
      feedback:       {},
      expiresAt:      addDays(new Date(), 30),
      createdAt:      new Date(),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved = await RecommendationModel.create(recommendation as any)
    requestLogger.info({ id: String(saved._id) }, 'Recommendation saved')

    // ── Generate image in background without Redis ───────────
    setImmediate(() => {
      this.triggerImageGenerationDirect(String(saved._id), clerkUserId, result.data, traceId)
        .catch((e) => logger.error({ e, id: String(saved._id) }, 'Background image generation failed'))
    })

    return this.mapToRecommendation(saved.toObject() as unknown as Record<string, unknown>)
  }

  // Direct image generation fallback (no queue)
  private async triggerImageGenerationDirect(
    recommendationId: string,
    userId:           string,
    outfit:           Outfit,
    traceId:          string,
  ): Promise<void> {
    try {
      await RecommendationModel.updateOne(
        { _id: recommendationId, userId },
        { $set: { imageStatus: 'generating' } },
      )
      const { ImageService } = await import('./image.service')
      const imageService     = new ImageService()
      const imageUrl         = await imageService.generateAndUpload(outfit, traceId)
      await RecommendationModel.updateOne(
        { _id: recommendationId, userId },
        { $set: { imageUrl, imageStatus: 'ready' } },
      )
    } catch (err) {
      await RecommendationModel.updateOne(
        { _id: recommendationId, userId },
        { $set: { imageStatus: 'failed' } },
      ).catch(() => { /* non-fatal */ })
      logger.error({ err, traceId, recommendationId }, 'Direct image generation failed')
    }
  }

  async getById(clerkUserId: string, id: string): Promise<OutfitRecommendation | null> {
    const doc = await RecommendationModel
      .findOne({ _id: id, userId: clerkUserId })
      .lean()
    return doc ? this.mapToRecommendation(doc) : null
  }

  async getHistory(
    clerkUserId: string,
    page:        number,
    limit:       number,
  ): Promise<{ items: OutfitRecommendation[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit
    const [docs, total] = await Promise.all([
      RecommendationModel
        .find({ userId: clerkUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RecommendationModel.countDocuments({ userId: clerkUserId }),
    ])
    return {
      items: docs.map((d) => this.mapToRecommendation(d)),
      total,
      page,
      pages: Math.ceil(total / limit),
    }
  }

  async delete(clerkUserId: string, id: string): Promise<boolean> {
    const result = await RecommendationModel.deleteOne({ _id: id, userId: clerkUserId })
    return result.deletedCount > 0
  }

  async submitFeedback(
    clerkUserId: string,
    id:          string,
    rating:      'like' | 'dislike',
    _reason?:    string,
  ): Promise<void> {
    const result = await RecommendationModel.updateOne(
      { _id: id, userId: clerkUserId },
      {
        $set: {
          'feedback.rating': rating,
          ...(rating === 'like' && { 'feedback.savedAt': new Date() }),
        },
      },
    )
    if (result.matchedCount === 0) {
      throw new Error('Recommendation not found or access denied')
    }
  }

  async getSaved(clerkUserId: string): Promise<OutfitRecommendation[]> {
    const docs = await RecommendationModel
      .find({ userId: clerkUserId, 'feedback.rating': 'like' })
      .sort({ 'feedback.savedAt': -1 })
      .limit(50)
      .lean()
    return docs.map((d) => this.mapToRecommendation(d))
  }

  private mapToRecommendation(doc: Record<string, unknown>): OutfitRecommendation {
    return {
      _id:            String(doc._id),
      userId:         doc.userId as string,
      requestHash:    doc.requestHash as string,
      occasion:       doc.occasion as string,
      weatherContext: doc.weatherContext as OutfitRecommendation['weatherContext'],
      outfit:         doc.outfit as OutfitRecommendation['outfit'],
      imageUrl:       doc.imageUrl as string | undefined,
      imageStatus:    doc.imageStatus as OutfitRecommendation['imageStatus'],
      aiProvider:     doc.aiProvider as OutfitRecommendation['aiProvider'],
      cacheHit:       doc.cacheHit as boolean,
      feedback:       (doc.feedback ?? {}) as OutfitRecommendation['feedback'],
      expiresAt:      doc.expiresAt as Date,
      createdAt:      doc.createdAt as Date,
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// DOMAIN ERRORS
// ─────────────────────────────────────────────────────────────────

export class ProfileNotFoundError extends Error {
  readonly statusCode = 404
  constructor() { super('User profile not found. Please complete your profile setup.'); this.name = 'ProfileNotFoundError' }
}

export class ProfileIncompleteError extends Error {
  readonly statusCode = 422
  constructor(field: string) { super(`Profile incomplete: missing ${field}. Please update your profile.`); this.name = 'ProfileIncompleteError' }
}

export class QuotaExceededError extends Error {
  readonly statusCode = 429
  constructor() { super(`Daily recommendation limit reached (${env.DAILY_QUOTA_LIMIT}/day). Try again tomorrow.`); this.name = 'QuotaExceededError' }
}

export const recommendationService = new RecommendationService()
