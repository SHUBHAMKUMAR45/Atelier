/**
 * Integration tests — Rate Limiting & Quota Enforcement
 *
 * Tests atomic quota, parallel request races, and middleware behavior.
 */

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { ProfileService }    from '../../src/services/profile.service'
import type { SetupProfileRequest } from '../../../../packages/shared/src/schemas'

let mongoServer: MongoMemoryServer
let profileService: ProfileService

const BASE_PROFILE: SetupProfileRequest = {
  displayName: 'Test User',
  email:       'test@example.com',
  preferences: {
    styles:      ['casual'],
    colors:      ['#FFFFFF'],
    avoidColors: [],
    occasions:   ['casual'],
    budget:      'mid',
    gender:      'prefer-not-to-say',
  },
}

// ─────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri(), { dbName: 'test' })
  profileService = new ProfileService()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

beforeEach(async () => {
  // Clean users collection between tests
  await mongoose.connection.collection('users').deleteMany({})
})

// ─────────────────────────────────────────────────────────────────
// QUOTA ENFORCEMENT
// ─────────────────────────────────────────────────────────────────

describe('Daily Quota — Atomic Enforcement', () => {
  const CLERK_ID = 'user_test_quota'

  beforeEach(async () => {
    // Set DAILY_QUOTA_LIMIT to 3 for tests
    process.env['DAILY_QUOTA_LIMIT'] = '3'
    await profileService.upsertProfile(CLERK_ID, BASE_PROFILE)
  })

  it('allows requests up to limit', async () => {
    const results = []
    for (let i = 0; i < 3; i++) {
      results.push(await profileService.consumeQuota(CLERK_ID))
    }
    expect(results).toEqual([true, true, true])
  })

  it('blocks the (limit+1)th request', async () => {
    for (let i = 0; i < 3; i++) await profileService.consumeQuota(CLERK_ID)
    const blocked = await profileService.consumeQuota(CLERK_ID)
    expect(blocked).toBe(false)
  })

  it('resets quota on new day', async () => {
    // Exhaust quota
    for (let i = 0; i < 3; i++) await profileService.consumeQuota(CLERK_ID)

    // Manually set quota date to yesterday
    await mongoose.connection.collection('users').updateOne(
      { clerkUserId: CLERK_ID },
      { $set: { 'dailyQuota.date': '2000-01-01', 'dailyQuota.count': 3 } },
    )

    // Should allow again (date reset)
    const allowed = await profileService.consumeQuota(CLERK_ID)
    expect(allowed).toBe(true)
  })

  // ── CRITICAL: Race condition test ───────────────────────────────

  it('prevents over-quota via parallel requests (RACE CONDITION test)', async () => {
    const LIMIT = 3

    // Fire LIMIT+2 concurrent requests
    const results = await Promise.all(
      Array.from({ length: LIMIT + 2 }, () => profileService.consumeQuota(CLERK_ID)),
    )

    const allowed = results.filter(Boolean).length
    const blocked = results.filter(r => !r).length

    // Exactly LIMIT should succeed — no more, no less
    expect(allowed).toBe(LIMIT)
    expect(blocked).toBe(2)
  })

  it('getQuotaStatus returns accurate counts', async () => {
    await profileService.consumeQuota(CLERK_ID)
    await profileService.consumeQuota(CLERK_ID)

    const status = await profileService.getQuotaStatus(CLERK_ID)
    expect(status.used).toBe(2)
    expect(status.limit).toBe(3)
    expect(status.remaining).toBe(1)
    expect(status.resetAt).toBeTruthy()
  })

  it('getQuotaStatus shows 0 used for new user', async () => {
    const status = await profileService.getQuotaStatus(CLERK_ID)
    expect(status.used).toBe(0)
    expect(status.remaining).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────
// CROSS-USER DATA ISOLATION
// ─────────────────────────────────────────────────────────────────

describe('Cross-User Data Isolation', () => {
  it('separate users have independent quotas', async () => {
    process.env['DAILY_QUOTA_LIMIT'] = '2'

    await profileService.upsertProfile('user_A', BASE_PROFILE)
    await profileService.upsertProfile('user_B', BASE_PROFILE)

    // Exhaust user_A
    await profileService.consumeQuota('user_A')
    await profileService.consumeQuota('user_A')
    const blockedA = await profileService.consumeQuota('user_A')

    // user_B should still have quota
    const allowedB = await profileService.consumeQuota('user_B')

    expect(blockedA).toBe(false)
    expect(allowedB).toBe(true)
  })

  it('getProfile returns null for wrong userId', async () => {
    await profileService.upsertProfile('user_real', BASE_PROFILE)

    const result = await profileService.getProfile('user_attacker')
    expect(result).toBeNull()
  })

  it('cannot consume quota for non-existent user', async () => {
    const result = await profileService.consumeQuota('user_ghost')
    expect(result).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────
// PROFILE VALIDATION
// ─────────────────────────────────────────────────────────────────

describe('Profile — Upsert & Update', () => {
  it('creates a new profile with default quota', async () => {
    const profile = await profileService.upsertProfile('user_new', BASE_PROFILE)
    expect(profile.clerkUserId).toBe('user_new')
    expect(profile.dailyQuota.count).toBe(0)
  })

  it('upserts without duplicate on second call', async () => {
    await profileService.upsertProfile('user_dup', BASE_PROFILE)
    await profileService.upsertProfile('user_dup', { ...BASE_PROFILE, displayName: 'Updated' })

    const profile = await profileService.getProfile('user_dup')
    expect(profile?.displayName).toBe('Updated')

    const count = await mongoose.connection.collection('users').countDocuments({
      clerkUserId: 'user_dup',
    })
    expect(count).toBe(1)       // must NOT create duplicates
  })

  it('throws when updating measurements for non-existent user', async () => {
    await expect(
      profileService.updateMeasurements('user_ghost', {
        height: 175, weight: 70,
      }),
    ).rejects.toThrow('Profile not found')
  })
})
