import { WardrobeItemModel } from '../db/models'
import type { CreateWardrobeItemRequest, WardrobeItem } from '../../../../packages/shared/src/schemas'
import { createLogger } from '../config/logger'

const logger = createLogger('wardrobe-service')

class WardrobeService {
  async getItems(userId: string): Promise<WardrobeItem[]> {
    try {
      const items = await WardrobeItemModel.find({ userId }).sort({ createdAt: -1 })
      return items.map(this.mapToSchema)
    } catch (err) {
      logger.error({ err, userId }, 'Failed to fetch wardrobe items')
      throw err
    }
  }

  async addItem(userId: string, data: CreateWardrobeItemRequest): Promise<WardrobeItem> {
    try {
      const item = await WardrobeItemModel.create({
        ...data,
        userId,
      })
      logger.info({ userId, itemId: item._id }, 'Wardrobe item added')
      return this.mapToSchema(item)
    } catch (err) {
      logger.error({ err, userId }, 'Failed to add wardrobe item')
      throw err
    }
  }

  async deleteItem(userId: string, itemId: string): Promise<void> {
    try {
      const result = await WardrobeItemModel.deleteOne({ _id: itemId, userId })
      if (result.deletedCount === 0) {
        throw new Error('Item not found or unauthorized')
      }
      logger.info({ userId, itemId }, 'Wardrobe item deleted')
    } catch (err) {
      logger.error({ err, userId, itemId }, 'Failed to delete wardrobe item')
      throw err
    }
  }

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

export const wardrobeService = new WardrobeService()
