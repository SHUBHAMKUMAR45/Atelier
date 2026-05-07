import { userRepository } from '../repositories/user.repository'
import { todayDateString, addDays } from '../../../../packages/shared/src/utils'
import { logger } from '../config/logger'
import { env }    from '../config/env'
import type {
  SetupProfileRequest,
  BodyMeasurements,
  UserPreferences,
  UserProfile,
} from '../../../../packages/shared/src/schemas'

export class PersistenceError extends Error {
  readonly status = 500
  constructor(message: string) {
    super(message)
    this.name = 'PersistenceError'
  }
}

export class ProfileService {
  // ── Create or update user profile ──────────────────────────────

  async upsertProfile(
    clerkUserId: string,
    data: SetupProfileRequest,
  ): Promise<UserProfile> {
    const today = todayDateString()

    const profile = await userRepository.upsert(clerkUserId, {
      email:        data.email,
      displayName:  data.displayName,
      ...(data.measurements && { measurements: data.measurements }),
      ...(data.preferences  && { preferences:  data.preferences }),
      ...(data.location     && { location:      data.location }),
      dailyQuota: { date: today, count: 0 },
    })

    // MongoDB write concern 'majority' guarantees durability — no read-after-write needed
    logger.info({ clerkUserId }, 'Profile upserted')
    return profile
  }

  // ── Get profile by Clerk user ID ────────────────────────────────

  async getProfile(clerkUserId: string): Promise<UserProfile | null> {
    return userRepository.findByClerkId(clerkUserId)
  }

  // ── Update measurements ─────────────────────────────────────────

  async updateMeasurements(
    clerkUserId: string,
    measurements: BodyMeasurements,
  ): Promise<void> {
    await userRepository.updateField(clerkUserId, 'measurements', measurements)
    logger.debug({ clerkUserId }, 'Measurements updated')
  }

  // ── Update preferences ──────────────────────────────────────────

  async updatePreferences(
    clerkUserId: string,
    preferences: UserPreferences,
  ): Promise<void> {
    await userRepository.updateField(clerkUserId, 'preferences', preferences)
    logger.debug({ clerkUserId }, 'Preferences updated')
  }

  // ── Check and consume daily quota (ATOMIC) ──────────────────────
  // Returns true if quota was consumed, false if exceeded

  async consumeQuota(clerkUserId: string): Promise<boolean> {
    const today = todayDateString()
    const limit = env.DAILY_QUOTA_LIMIT

    const currentCount = await userRepository.incrementQuota(clerkUserId, today)

    if (currentCount > limit) {
      logger.warn({ clerkUserId, today, count: currentCount, limit }, 'Daily quota exceeded')
      return false
    }

    logger.debug(
      { clerkUserId, count: currentCount, limit },
      'Quota consumed',
    )
    return true
  }

  // ── Rollback quota (call on AI failure AFTER consumeQuota) ────────
  async rollbackQuota(clerkUserId: string): Promise<void> {
    const today = todayDateString()
    try {
      await userRepository.decrementQuota(clerkUserId, today)
      logger.info({ clerkUserId }, 'Quota rolled back after AI failure')
    } catch (err) {
      // Non-fatal: log but don't throw — quota rollback failure is better than crashing
      logger.error({ clerkUserId, err }, 'Failed to rollback quota')
    }
  }

  // ── Get quota status from an already-fetched profile (zero extra DB reads) ──
  computeQuotaFromProfile(profile: UserProfile | null): {
    used:      number
    limit:     number
    remaining: number
    resetAt:   string
  } {
    const today    = todayDateString()
    const count    = profile?.dailyQuota?.date === today
      ? (profile.dailyQuota.count ?? 0)
      : 0
    const limit    = env.DAILY_QUOTA_LIMIT
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(0, 0, 0, 0)

    return {
      used:      count,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt:   tomorrow.toISOString(),
    }
  }

  // ── Get quota status (standalone, issues its own DB read) ──────
  async getQuotaStatus(clerkUserId: string): Promise<{
    used:      number
    limit:     number
    remaining: number
    resetAt:   string
  }> {
    const profile = await userRepository.findByClerkId(clerkUserId)
    return this.computeQuotaFromProfile(profile)
  }
}

export const profileService = new ProfileService()
