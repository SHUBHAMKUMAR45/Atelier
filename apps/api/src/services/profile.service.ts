import { UserProfileModel } from '../db/models'
import { todayDateString, addDays } from '../../../../packages/shared/src/utils'
import { logger } from '../config/logger'
import { env }    from '../config/env'
import type {
  SetupProfileRequest,
  BodyMeasurements,
  UserPreferences,
  UserProfile,
} from '../../../../packages/shared/src/schemas'

export class ProfileService {
  // ── Create or update user profile ──────────────────────────────

  async upsertProfile(
    clerkUserId: string,
    data: SetupProfileRequest,
  ): Promise<UserProfile> {
    const today = todayDateString()

    const doc = await UserProfileModel.findOneAndUpdate(
      { clerkUserId },
      {
        $set: {
          email:        data.email,
          displayName:  data.displayName,
          ...(data.measurements && { measurements: data.measurements }),
          ...(data.preferences  && { preferences:  data.preferences }),
          ...(data.location     && { location:      data.location }),
        },
        $setOnInsert: {
          clerkUserId,
          dailyQuota: { date: today, count: 0 },
        },
      },
      { upsert: true, new: true, runValidators: true },
    ).lean()

    if (!doc) throw new Error('Failed to upsert profile')

    logger.info({ clerkUserId }, 'Profile upserted')
    return this.mapToProfile(doc)
  }

  // ── Get profile by Clerk user ID ────────────────────────────────

  async getProfile(clerkUserId: string): Promise<UserProfile | null> {
    const doc = await UserProfileModel
      .findOne({ clerkUserId })   // ALWAYS scoped by clerkUserId
      .lean()

    return doc ? this.mapToProfile(doc) : null
  }

  // ── Update measurements ─────────────────────────────────────────

  async updateMeasurements(
    clerkUserId: string,
    measurements: BodyMeasurements,
  ): Promise<void> {
    await UserProfileModel.findOneAndUpdate(
      { clerkUserId },
      { $set: { measurements } },
      { upsert: true, runValidators: true }
    )
    logger.debug({ clerkUserId }, 'Measurements updated (upserted)')
  }

  // ── Update preferences ──────────────────────────────────────────

  async updatePreferences(
    clerkUserId: string,
    preferences: UserPreferences,
  ): Promise<void> {
    await UserProfileModel.findOneAndUpdate(
      { clerkUserId },
      { $set: { preferences } },
      { upsert: true, runValidators: true }
    )
    logger.debug({ clerkUserId }, 'Preferences updated (upserted)')
  }

  // ── Check and consume daily quota (ATOMIC) ──────────────────────
  // Returns true if quota was consumed, false if exceeded

  async consumeQuota(clerkUserId: string): Promise<boolean> {
    const today = todayDateString()
    const limit = env.DAILY_QUOTA_LIMIT

    // Atomic: reset if new day, then increment only if under limit
    // Pattern: findOneAndUpdate with conditional $inc

    // First, reset quota if date has changed
    await UserProfileModel.updateOne(
      { clerkUserId, 'dailyQuota.date': { $ne: today } },
      { $set: { 'dailyQuota.date': today, 'dailyQuota.count': 0 } },
    )

    // Now atomically increment if under limit
    const result = await UserProfileModel.findOneAndUpdate(
      {
        clerkUserId,
        'dailyQuota.date':  today,
        'dailyQuota.count': { $lt: limit },
      },
      { $inc: { 'dailyQuota.count': 1 } },
      { new: true },
    ).lean()

    if (!result) {
      logger.warn({ clerkUserId, today }, 'Daily quota exceeded')
      return false
    }

    logger.debug(
      { clerkUserId, count: result.dailyQuota?.count ?? 0, limit },
      'Quota consumed',
    )
    return true
  }

  // ── Get quota status ────────────────────────────────────────────

  async getQuotaStatus(clerkUserId: string): Promise<{
    used:      number
    limit:     number
    remaining: number
    resetAt:   string
  }> {
    const profile = await UserProfileModel
      .findOne({ clerkUserId })
      .select('dailyQuota')
      .lean()

    const today  = todayDateString()
    const count  = profile?.dailyQuota?.date === today
      ? (profile.dailyQuota.count ?? 0)
      : 0
    const limit     = env.DAILY_QUOTA_LIMIT
    const tomorrow  = addDays(new Date(), 1)
    tomorrow.setHours(0, 0, 0, 0)

    return {
      used:      count,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt:   tomorrow.toISOString(),
    }
  }

  // ── Type mapper ─────────────────────────────────────────────────

  private mapToProfile(doc: Record<string, unknown>): UserProfile {
    return {
      _id:          String(doc._id),
      clerkUserId:  doc.clerkUserId as string,
      email:        doc.email as string,
      displayName:  doc.displayName as string,
      measurements: doc.measurements as UserProfile['measurements'],
      preferences:  doc.preferences  as UserProfile['preferences'],
      location:     doc.location     as UserProfile['location'],
      dailyQuota:   doc.dailyQuota   as UserProfile['dailyQuota'],
      createdAt:    doc.createdAt as Date,
      updatedAt:    doc.updatedAt as Date,
    }
  }
}

export const profileService = new ProfileService()
