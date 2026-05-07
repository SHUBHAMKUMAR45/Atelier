import { UserProfileModel } from '../db/models'
import type { UserProfile, SetupProfileRequest, BodyMeasurements, UserPreferences } from '../../../../packages/shared/src/schemas'
import { createLogger } from '../config/logger'

const logger = createLogger('user-repository')

export class UserRepository {
  /**
   * Find user profile by Clerk ID.
   */
  async findByClerkId(clerkUserId: string): Promise<UserProfile | null> {
    try {
      const doc = await UserProfileModel.findOne({ clerkUserId }).lean()
      return doc ? this.mapToSchema(doc) : null
    } catch (err) {
      logger.error({ err, clerkUserId }, 'Error in findByClerkId')
      throw err
    }
  }

  /**
   * Create or update profile (Upsert).
   */
  async upsert(clerkUserId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profile = await UserProfileModel.findOneAndUpdate(
        { clerkUserId },
        { $set: data },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      return this.mapToSchema(profile.toObject())
    } catch (err) {
      logger.error({ err, clerkUserId }, 'Error in upsert user profile')
      throw err
    }
  }

  /**
   * Mapping helper.
   */
  private mapToSchema(doc: any): UserProfile {
    return {
      _id:          doc._id.toString(),
      clerkUserId:  doc.clerkUserId,
      email:        doc.email,
      displayName:  doc.displayName,
      measurements: doc.measurements,
      preferences:  doc.preferences,
      location:     doc.location,
      dailyQuota:   doc.dailyQuota,
      createdAt:    doc.createdAt,
      updatedAt:    doc.updatedAt,
    }
  }

  /**
   * Update specific categories (measurements, preferences, etc).
   */
  async updateField(clerkUserId: string, field: string, data: any): Promise<void> {
    try {
      await UserProfileModel.updateOne(
        { clerkUserId },
        { $set: { [field]: data } }
      )
    } catch (err) {
      logger.error({ err, clerkUserId, field }, 'Error updating user field')
      throw err
    }
  }

  /**
   * Atomic quota increment.
   */
  async incrementQuota(clerkUserId: string, date: string): Promise<number> {
    try {
      // 1. Try to increment if date already matches (Most common case)
      let res = await UserProfileModel.findOneAndUpdate(
        { clerkUserId, 'dailyQuota.date': date },
        { $inc: { 'dailyQuota.count': 1 } },
        { new: true }
      )
      
      // 2. If no match (new day), perform a conditional set to avoid overwriting a concurrent reset
      if (!res) {
        res = await UserProfileModel.findOneAndUpdate(
          { clerkUserId, $or: [{ 'dailyQuota.date': { $ne: date } }, { dailyQuota: { $exists: false } }] },
          { $set: { 'dailyQuota': { date, count: 1 } } },
          { new: true }
        )
      }
      
      return res?.dailyQuota?.count ?? 1
    } catch (err) {
      logger.error({ err, clerkUserId }, 'Error incrementing quota')
      throw err
    }
  }

  async decrementQuota(clerkUserId: string, date: string): Promise<void> {
    // Decrement by 1, but never below 0 (used for quota rollback on AI failure)
    await UserProfileModel.findOneAndUpdate(
      { clerkUserId, 'dailyQuota.date': date, 'dailyQuota.count': { $gt: 0 } },
      { $inc: { 'dailyQuota.count': -1 } },
    )
  }
}

export const userRepository = new UserRepository()
