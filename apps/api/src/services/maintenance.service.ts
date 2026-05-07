import { logger }                  from '../config/logger'
import { RecommendationModel, AICacheModel }  from '../db/models'

export class MaintenanceService {
  /**
   * Run all maintenance tasks sequentially
   */
  async runAllTasks(): Promise<void> {
    logger.info('Starting all database maintenance tasks')
    
    try {
      await Promise.all([
        this.expireRecommendations(),
        this.expireCache(),
        // syncIndexes() intentionally excluded — already called at bootstrap (index.ts)
      ])
      
      logger.info('All maintenance tasks completed successfully')
    } catch (err) {
      logger.error({ err }, 'Maintenance tasks failed')
    }
  }

  /**
   * Delete failed image generations and reset stuck 'generating' states
   */
  async expireRecommendations(): Promise<Record<string, number>> {
    const now = new Date()

    // Delete failed image generations older than 7 days
    const imageFailed = await RecommendationModel.deleteMany({
      imageStatus: 'failed',
      createdAt:   { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    })

    // Reset stale 'generating' status (stuck for > 1 hour)
    const stuckGenerating = await RecommendationModel.updateMany(
      {
        imageStatus: 'generating',
        updatedAt:   { $lt: new Date(now.getTime() - 60 * 60 * 1000) },
      },
      { $set: { imageStatus: 'failed' } },
    )

    logger.info({
      imageFailedDeleted:    imageFailed.deletedCount,
      stuckGeneratingReset:  stuckGenerating.modifiedCount,
    }, 'Recommendation cleanup complete')

    return {
      imageFailedDeleted:   imageFailed.deletedCount,
      stuckGeneratingReset: stuckGenerating.modifiedCount,
    }
  }

  /**
   * Purge expired and unused AI cache entries
   */
  async expireCache(): Promise<Record<string, number>> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000) // 48h

    const result = await AICacheModel.deleteMany({
      hitCount:     0,
      createdAt:    { $lt: cutoff },
      ttlExpiresAt: { $lt: new Date() },
    })

    logger.info({ deleted: result.deletedCount }, 'Cache cleanup complete')
    return { deleted: result.deletedCount }
  }

  /**
   * Ensure MongoDB indexes are synchronized
   */
  async syncIndexes(): Promise<void> {
    try {
      await RecommendationModel.syncIndexes()
      await AICacheModel.syncIndexes()
      logger.info('MongoDB indexes synchronized')
    } catch (err) {
      logger.warn({ err }, 'Failed to sync indexes during maintenance')
    }
  }
}
