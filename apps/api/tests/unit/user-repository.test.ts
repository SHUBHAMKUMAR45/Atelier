import { userRepository } from '../../src/repositories/user.repository'
import { UserProfileModel } from '../../src/db/models'

// Mock the model
jest.mock('../../src/db/models', () => ({
  UserProfileModel: {
    findOne:          jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne:        jest.fn(),
  },
}))

describe('UserRepository Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findByClerkId', () => {
    it('should map Mongo document to shared schema correctly', async () => {
      const mockDoc = {
        _id:          { toString: () => 'mongo_id_123' },
        clerkUserId:  'clerk_123',
        email:        'test@test.com',
        displayName:  'Test User',
        dailyQuota:   { date: '2024-01-01', count: 0 },
        toObject:     function() { return this }
      }

      ;(UserProfileModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockDoc)
      })

      const result = await userRepository.findByClerkId('clerk_123')

      expect(result).not.toBeNull()
      expect(result?._id).toBe('mongo_id_123')
      expect(result?.clerkUserId).toBe('clerk_123')
      expect(UserProfileModel.findOne).toHaveBeenCalledWith({ clerkUserId: 'clerk_123' })
    })

    it('should return null if doc not found', async () => {
      ;(UserProfileModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })
      const result = await userRepository.findByClerkId('unknown')
      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('should call findOneAndUpdate with correct params', async () => {
      const data = { displayName: 'Updated' }
      const mockDoc = { 
        _id: { toString: () => '123' },
        ...data,
        toObject: function() { return this }
      }

      ;(UserProfileModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockDoc)

      await userRepository.upsert('clerk_123', data as any)

      expect(UserProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        { clerkUserId: 'clerk_123' },
        { $set: data },
        expect.objectContaining({ upsert: true })
      )
    })
  })
})
