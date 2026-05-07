import { RecommendationModel } from '../db/models'
import type { OutfitRecommendation } from '../../../../packages/shared/src/schemas'
import { createLogger } from '../config/logger'

const logger = createLogger('recommendation-repository')

export class RecommendationRepository {
  /**
   * Find a recommendation by its unique request hash.
   */
  async findByHash(requestHash: string): Promise<OutfitRecommendation | null> {
    try {
      const doc = await RecommendationModel.findOne({ requestHash }).lean()
      return doc ? this.mapToSchema(doc) : null
    } catch (err) {
      logger.error({ err, requestHash }, 'Error finding recommendation by hash')
      throw err
    }
  }

  /**
   * Find a recommendation by ID, scoped to user.
   */
  async findById(userId: string, id: string): Promise<OutfitRecommendation | null> {
    try {
      const doc = await RecommendationModel.findOne({ _id: id, userId }).lean()
      return doc ? this.mapToSchema(doc) : null
    } catch (err) {
      logger.error({ err, userId, id }, 'Error finding recommendation by ID')
      throw err
    }
  }

  /**
   * Fetch paginated history for a user.
   */
  async findHistory(userId: string, page: number, limit: number): Promise<{ items: OutfitRecommendation[], total: number }> {
    try {
      const skip = (page - 1) * limit
      const [items, total] = await Promise.all([
        RecommendationModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        RecommendationModel.countDocuments({ userId })
      ])
      return { 
        items: items.map(d => this.mapToSchema(d)), 
        total 
      }
    } catch (err) {
      logger.error({ err, userId }, 'Error fetching recommendation history')
      throw err
    }
  }

  /**
   * Create a new recommendation.
   */
  async create(data: Partial<OutfitRecommendation>): Promise<OutfitRecommendation> {
    try {
      const doc = await RecommendationModel.create(data)
      return this.mapToSchema(doc.toObject())
    } catch (err) {
      logger.error({ err, userId: data.userId }, 'Error creating recommendation')
      throw err
    }
  }

  /**
   * Update feedback rating on a recommendation.
   */
  async updateFeedback(userId: string, id: string, rating: string): Promise<void> {
    try {
      await RecommendationModel.updateOne(
        { _id: id, userId },
        { $set: { 'feedback.rating': rating, 'feedback.savedAt': new Date() } }
      )
    } catch (err) {
      logger.error({ err, userId, id }, 'Error updating recommendation feedback')
      throw err
    }
  }

  /**
   * Update image status.
   */
  async updateImageStatus(userId: string, id: string, imageStatus: OutfitRecommendation['imageStatus']): Promise<void> {
    try {
      await RecommendationModel.updateOne({ _id: id, userId }, { $set: { imageStatus } })
    } catch (err) {
      logger.error({ err, userId, id, imageStatus }, 'Error updating image status')
      throw err
    }
  }

  /**
   * Update image URL and mark as ready.
   */
  async updateImageUrl(userId: string, id: string, imageUrl: string): Promise<void> {
    try {
      await RecommendationModel.updateOne(
        { _id: id, userId },
        { $set: { imageUrl, imageStatus: 'ready' } }
      )
    } catch (err) {
      logger.error({ err, userId, id }, 'Error updating image URL')
      throw err
    }
  }

  /**
   * Find saved recommendations (liked).
   */
  async findSaved(userId: string, limit = 50): Promise<OutfitRecommendation[]> {
    try {
      const docs = await RecommendationModel
        .find({ userId, 'feedback.rating': 'like' })
        .sort({ 'feedback.savedAt': -1 })
        .limit(limit)
        .lean()
      return docs.map(d => this.mapToSchema(d))
    } catch (err) {
      logger.error({ err, userId }, 'Error fetching saved recommendations')
      throw err
    }
  }

  /**
   * Delete a recommendation.
   */
  async delete(userId: string, id: string): Promise<boolean> {
    try {
      const result = await RecommendationModel.deleteOne({ _id: id, userId })
      return result.deletedCount > 0
    } catch (err) {
      logger.error({ err, userId, id }, 'Error deleting recommendation')
      throw err
    }
  }

  /**
   * Helper to map Mongo document to shared OutfitRecommendation schema.
   */
  private mapToSchema(doc: any): OutfitRecommendation {
    return {
      _id:            doc._id.toString(),
      userId:         doc.userId,
      requestHash:    doc.requestHash,
      occasion:       doc.occasion,
      weatherContext: doc.weatherContext,
      outfit:         doc.outfit,
      imageUrl:       doc.imageUrl,
      imageStatus:    doc.imageStatus,
      aiProvider:     doc.aiProvider,
      cacheHit:       doc.cacheHit,
      feedback:       doc.feedback ?? {},
      expiresAt:      doc.expiresAt,
      createdAt:      doc.createdAt,
      updatedAt:      doc.updatedAt,
    }
  }
}

export const recommendationRepository = new RecommendationRepository()
