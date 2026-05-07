import { AIOrchestrator }  from '../../../../packages/ai-core/src/orchestrator'
import { cacheService }    from './cache.service'
import { hashCacheKey }    from '../../../../packages/shared/src/utils'
import { logger }          from '../config/logger'
import { env }             from '../config/env'
import type { AITrendOutput } from '../../../../packages/shared/src/schemas'

let orchestrator: AIOrchestrator | null = null

function getOrchestrator(): AIOrchestrator {
  if (!orchestrator) {
    orchestrator = new AIOrchestrator({
      geminiApiKey: env.GEMINI_API_KEY,
      openaiApiKey: env.OPENAI_API_KEY,
    })
  }
  return orchestrator
}

function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Autumn'
  return 'Winter'
}

export class TrendsService {
  async getTrends(location: string, traceId: string): Promise<AITrendOutput> {
    const season    = getCurrentSeason()
    const cacheKey  = hashCacheKey({ location: location.toLowerCase(), season, type: 'trend' })

    logger.debug({ traceId, location, season, cacheKey }, 'Fetching trends')

    const result = await getOrchestrator().generateTrends(
      { location, season, traceId },
      cacheKey,
      () => cacheService.getTrends(cacheKey),
      (data) => cacheService.setTrends(cacheKey, data),
    )

    logger.info({
      traceId,
      provider:  result.provider,
      cacheHit:  result.provider === 'cached',
      latencyMs: result.latencyMs,
    }, 'Trends fetched')

    return result.data
  }
}

export const trendsService = new TrendsService()
