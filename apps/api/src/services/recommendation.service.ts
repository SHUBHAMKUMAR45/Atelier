import { recommendationRepository } from '../repositories/recommendation.repository'
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
  WardrobeItem,
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

    // ── Pre-flight: Check quota WITHOUT consuming it yet ────────────
    // Computed from already-fetched profile — zero extra DB reads.
    // Quota is only consumed AFTER successful AI response to prevent credit loss on failure.
    const quotaStatus = profileService.computeQuotaFromProfile(profile)
    if (quotaStatus.remaining <= 0) {
      metrics.quotaExceeded.inc()
      throw new QuotaExceededError()
    }

    // ── Parallel: Fetch weather + wardrobe (no quota touch yet) ─────
    const [weather, wardrobe] = await Promise.all([
      (request.location ?? profile.location)
        ? weatherService.getWeather(
            (request.location ?? profile.location!)!.lat, 
            (request.location ?? profile.location!)!.lon
          )
        : Promise.resolve(weatherService.getSeasonalFallback()),
      request.useWardrobe 
        ? wardrobeService.getItems(clerkUserId)
        : Promise.resolve([] as WardrobeItem[])
    ])

    const requestHash = hashRequestId(
      clerkUserId,
      request.occasion,
      { temp: weather.temp, condition: weather.condition },
      { budget: profile.preferences.budget, styles: profile.preferences.styles },
      request.useWardrobe,
    )

    // Idempotency check
    const existing = await recommendationRepository.findByHash(requestHash)
    if (existing && existing.userId === clerkUserId) {
      requestLogger.info({ requestHash }, 'Returning idempotent recommendation')
      return existing
    }

    // Sanitize user-supplied description before AI
    const sanitizedDescription = request.description
      ? sanitizeForAIPrompt(request.description)
      : undefined

    // ── Consume quota just before saving (AI is about to be called) ──
    // If AI fails, we rollback. If save fails, we rollback.
    const quotaOk = await profileService.consumeQuota(clerkUserId)
    if (!quotaOk) {
      // Race condition: another request consumed the last slot between check and consume
      metrics.quotaExceeded.inc()
      throw new QuotaExceededError()
    }

    let aiSucceeded = false
    const aiStart = Date.now()
    // Declared here so it's in scope for post-AI processing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any
    try {
      result = await getOrchestrator().generateOutfit(
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

      aiSucceeded = true
    } catch (aiErr) {
      // AI failed — attempt quota rollback (best-effort, never swallows original error)
      try {
        await profileService.rollbackQuota(clerkUserId)
        requestLogger.info('Quota rolled back after AI failure')
      } catch (rollbackErr) {
        requestLogger.error({ rollbackErr }, 'Quota rollback also failed — credit may be lost')
      }
      requestLogger.error({ aiErr }, 'AI generation failed')
      throw aiErr
    }

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

    const recommendationData: Partial<OutfitRecommendation> = {
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
    }

    // ── Save to DB — rollback quota if this also fails ──────────
    let saved: OutfitRecommendation
    try {
      saved = await recommendationRepository.create(recommendationData)
      requestLogger.info({ id: saved._id }, 'Recommendation saved')
    } catch (saveErr) {
      // AI succeeded but DB write failed — attempt quota rollback, never swallow error
      try {
        await profileService.rollbackQuota(clerkUserId)
        requestLogger.info('Quota rolled back after DB save failure')
      } catch (rollbackErr) {
        requestLogger.error({ rollbackErr }, 'Quota rollback also failed after save error')
      }
      requestLogger.error({ saveErr }, 'DB save failed after successful AI response')
      throw saveErr
    }

    // ── Generate image in background ───────────
    setImmediate(() => {
      this.triggerImageGenerationDirect(saved._id, clerkUserId, result.data, traceId)
        .catch((e) => logger.error({ e, id: saved._id }, 'Background image generation failed'))
    })

    return saved
  }

  // Direct image generation fallback (no queue)
  private async triggerImageGenerationDirect(
    recommendationId: string,
    userId:           string,
    outfit:           Outfit,
    traceId:          string,
  ): Promise<void> {
    try {
      await recommendationRepository.updateImageStatus(userId, recommendationId, 'generating')
      
      const { ImageService } = await import('./image.service')
      const imageService     = new ImageService()
      const imageUrl         = await imageService.generateAndUpload(outfit, traceId)
      
      await recommendationRepository.updateImageUrl(userId, recommendationId, imageUrl)
    } catch (err) {
      await recommendationRepository.updateImageStatus(userId, recommendationId, 'failed')
        .catch(() => { /* non-fatal */ })
      logger.error({ err, traceId, recommendationId }, 'Direct image generation failed')
    }
  }

  async getById(clerkUserId: string, id: string): Promise<OutfitRecommendation | null> {
    return recommendationRepository.findById(clerkUserId, id)
  }

  async getHistory(
    clerkUserId: string,
    page:        number,
    limit:       number,
  ): Promise<{ items: OutfitRecommendation[]; total: number; page: number; pages: number }> {
    const { items, total } = await recommendationRepository.findHistory(clerkUserId, page, limit)
    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    }
  }

  async delete(clerkUserId: string, id: string): Promise<boolean> {
    return recommendationRepository.delete(clerkUserId, id)
  }

  async submitFeedback(
    clerkUserId: string,
    id:          string,
    rating:      'like' | 'dislike',
    _reason?:    string,
  ): Promise<void> {
    await recommendationRepository.updateFeedback(clerkUserId, id, rating)
  }

  async getSaved(clerkUserId: string): Promise<OutfitRecommendation[]> {
    return recommendationRepository.findSaved(clerkUserId)
  }
}

// ─────────────────────────────────────────────────────────────────
// DOMAIN ERRORS
// ─────────────────────────────────────────────────────────────────

export class ProfileNotFoundError extends Error {
  readonly status = 404
  constructor() { super('User profile not found. Please complete your profile setup.'); this.name = 'ProfileNotFoundError' }
}

export class ProfileIncompleteError extends Error {
  readonly status = 422
  constructor(field: string) { super(`Profile incomplete: missing ${field}. Please update your profile.`); this.name = 'ProfileIncompleteError' }
}

export class QuotaExceededError extends Error {
  readonly status = 429
  constructor() { super(`Daily recommendation limit reached (${env.DAILY_QUOTA_LIMIT}/day). Try again tomorrow.`); this.name = 'QuotaExceededError' }
}

export const recommendationService = new RecommendationService()
