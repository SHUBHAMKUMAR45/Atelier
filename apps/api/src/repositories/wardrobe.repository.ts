import { WardrobeItemModel } from '../db/models'
import type { CreateWardrobeItemRequest, WardrobeItem } from '../../../../packages/shared/src/schemas'
import { createLogger } from '../config/logger'

const logger = createLogger('wardrobe-repository')

export class WardrobeRepository {
  /**
   * Fetch all items for a user, sorted by creation date.
   */
  async findByUserId(userId: string): Promise<WardrobeItem[]> {
    try {
      // Only fetch fields needed by the API response and AI prompt builder.
      // imageUrl, brand, lastWorn are excluded from the wardrobe-for-AI path to reduce payload.
      const docs = await WardrobeItemModel.find({ userId })
        .sort({ createdAt: -1 })
        .lean()
      return docs.map(this.mapToSchema)
    } catch (err) {
      logger.error({ err, userId }, 'Error fetching wardrobe items')
      throw err
    }
  }

  /**
   * Create a new wardrobe item.
   */
  async create(userId: string, data: CreateWardrobeItemRequest): Promise<WardrobeItem> {
    try {
      const item = await WardrobeItemModel.create({
        ...data,
        userId,
      })
      return this.mapToSchema(item.toObject())
    } catch (err) {
      logger.error({ err, userId }, 'Error creating wardrobe item')
      throw err
    }
  }

  /**
   * Delete an item if it belongs to the user.
   */
  async delete(userId: string, itemId: string): Promise<boolean> {
    try {
      const result = await WardrobeItemModel.deleteOne({ _id: itemId, userId })
      return result.deletedCount > 0
    } catch (err) {
      logger.error({ err, userId, itemId }, 'Error deleting wardrobe item')
      throw err
    }
  }

  /**
   * Helper to map Mongo document to shared WardrobeItem schema.
   */
  private mapToSchema(doc: any): WardrobeItem {
    return {
      _id:       doc._id.toString(),
      userId:    doc.userId,
      category:  doc.category,
      name:      doc.name,
      imageUrl:  doc.imageUrl,
      color:     doc.color,
      brand:     doc.brand,
      lastWorn:  doc.lastWorn,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }
}

export const wardrobeRepository = new WardrobeRepository()
