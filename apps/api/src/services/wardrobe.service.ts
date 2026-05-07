import { wardrobeRepository } from '../repositories/wardrobe.repository'
import type { CreateWardrobeItemRequest, WardrobeItem } from '../../../../packages/shared/src/schemas'
import { createLogger } from '../config/logger'

const logger = createLogger('wardrobe-service')

class WardrobeService {
  async getItems(userId: string): Promise<WardrobeItem[]> {
    return wardrobeRepository.findByUserId(userId)
  }

  async addItem(userId: string, data: CreateWardrobeItemRequest): Promise<WardrobeItem> {
    const item = await wardrobeRepository.create(userId, data)
    logger.info({ userId, itemId: item._id }, 'Wardrobe item added')
    return item
  }

  async deleteItem(userId: string, itemId: string): Promise<void> {
    const deleted = await wardrobeRepository.delete(userId, itemId)
    if (!deleted) {
      throw new Error('Item not found or unauthorized')
    }
    logger.info({ userId, itemId }, 'Wardrobe item deleted')
  }
}

export const wardrobeService = new WardrobeService()
