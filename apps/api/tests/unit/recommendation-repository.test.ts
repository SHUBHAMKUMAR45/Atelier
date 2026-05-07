import { recommendationRepository } from '../../src/repositories/recommendation.repository'
import { RecommendationModel }     from '../../src/db/models'

jest.mock('../../src/db/models', () => ({
  RecommendationModel: {
    findOne:        jest.fn(),
    find:           jest.fn(),
    create:         jest.fn(),
    updateOne:      jest.fn(),
    countDocuments: jest.fn(),
  },
}))

describe('RecommendationRepository Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findByHash', () => {
    it('should correctly map IDs to strings', async () => {
      const mockDoc = {
        _id: { toString: () => 'rec_123' },
        requestHash: 'hash_abc',
        userId: 'user_1',
        occasion: 'work',
        weatherContext: { temp: 20 },
        outfit: { title: 'Fit' },
        imageStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(RecommendationModel.findOne as jest.Mock).mockReturnValue({
        lean: () => Promise.resolve(mockDoc)
      })

      const result = await recommendationRepository.findByHash('hash_abc')

      expect(result).not.toBeNull()
      expect(result?._id).toBe('rec_123')
      expect(result?.requestHash).toBe('hash_abc')
    })
  })

  describe('updateImageStatus', () => {
    it('should call updateOne with standard envelope', async () => {
      await recommendationRepository.updateImageStatus('user_1', 'rec_1', 'generating')
      expect(RecommendationModel.updateOne).toHaveBeenCalledWith(
        { _id: 'rec_1', userId: 'user_1' },
        { $set: { imageStatus: 'generating' } }
      )
    })
  })

  describe('findHistory', () => {
    it('should handle pagination math correctly', async () => {
      const mockItems = [{ _id: { toString: () => '1' } }]
      
      ;(RecommendationModel.find as jest.Mock).mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => Promise.resolve(mockItems)
            })
          })
        })
      })
      ;(RecommendationModel.countDocuments as jest.Mock).mockResolvedValue(100)

      const result = await recommendationRepository.findHistory('user_1', 2, 10)

      expect(result.total).toBe(100)
      expect(result.items.length).toBe(1)
      expect(RecommendationModel.find).toHaveBeenCalledWith({ userId: 'user_1' })
    })
  })
})
