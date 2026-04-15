/**
 * Data Lifecycle Job
 *
 * Runs nightly (via cron or GitHub Actions schedule) to:
 * 1. Hard-delete expired recommendations (TTL index handles this too — belt & braces)
 * 2. Purge orphaned AI cache entries
 * 3. Archive old feedback (keep 90 days)
 * 4. Log storage stats
 *
 * MongoDB Atlas free tier: 512MB limit
 * This job ensures we stay well under that.
 *
 * Usage:
 *   node -r tsx/cjs scripts/lifecycle.ts
 *   or via GitHub Actions schedule (see .github/workflows/lifecycle.yml)
 */

import mongoose from 'mongoose'

const MONGODB_URI  = process.env['MONGODB_URI']
const MONGODB_DB   = process.env['MONGODB_DB_NAME'] ?? 'ai-fashion-stylist'

if (!MONGODB_URI) {
  console.error('MONGODB_URI required')
  process.exit(1)
}

interface CollectionStats {
  name:      string
  count:     number
  sizeBytes: number
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting data lifecycle job`)

  await mongoose.connect(MONGODB_URI!, { dbName: MONGODB_DB })
  const db = mongoose.connection.db!

  const now      = new Date()
  const ago30d   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ago90d   = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const ago7d    = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)

  const results: Record<string, number> = {}

  // ── 1. Hard-delete expired recommendations ─────────────────────
  // MongoDB TTL index already handles this, but this is belt-and-braces
  const expiredRec = await db.collection('recommendations').deleteMany({
    expiresAt: { $lt: now },
  })
  results['recommendations.expired'] = expiredRec.deletedCount
  console.log(`  Deleted ${expiredRec.deletedCount} expired recommendations`)

  // ── 2. Purge expired AI cache entries ──────────────────────────
  const expiredCache = await db.collection('ai_cache').deleteMany({
    ttlExpiresAt: { $lt: now },
  })
  results['ai_cache.expired'] = expiredCache.deletedCount
  console.log(`  Deleted ${expiredCache.deletedCount} expired cache entries`)

  // ── 3. Archive old feedback (beyond 90 days) ───────────────────
  const oldFeedback = await db.collection('feedback').deleteMany({
    createdAt: { $lt: ago90d },
  })
  results['feedback.old'] = oldFeedback.deletedCount
  console.log(`  Deleted ${oldFeedback.deletedCount} old feedback entries (>90d)`)

  // ── 4. Purge zero-hit cache entries older than 7 days ──────────
  const staleCache = await db.collection('ai_cache').deleteMany({
    hitCount:  0,
    createdAt: { $lt: ago7d },
  })
  results['ai_cache.stale'] = staleCache.deletedCount
  console.log(`  Deleted ${staleCache.deletedCount} zero-hit stale cache entries`)

  // ── 5. Log storage stats ───────────────────────────────────────
  const collections = ['users', 'recommendations', 'ai_cache', 'feedback']
  const stats: CollectionStats[] = []

  for (const name of collections) {
    try {
      const colStats = await db.command({ collStats: name })
      stats.push({
        name,
        count:     colStats.count as number,
        sizeBytes: colStats.size as number,
      })
    } catch {
      stats.push({ name, count: 0, sizeBytes: 0 })
    }
  }

  const totalMB = stats.reduce((sum, s) => sum + s.sizeBytes, 0) / (1024 * 1024)

  console.log('\n  Storage Stats:')
  stats.forEach(s => {
    const mb = (s.sizeBytes / 1024 / 1024).toFixed(2)
    console.log(`    ${s.name.padEnd(20)} ${String(s.count).padStart(6)} docs  ${mb.padStart(6)} MB`)
  })
  console.log(`    ${'TOTAL'.padEnd(20)} ${''.padStart(6)}       ${totalMB.toFixed(2).padStart(6)} MB`)
  console.log(`    ${'FREE TIER LIMIT'.padEnd(20)} ${''.padStart(6)}       ${' 512.00'.padStart(6)} MB`)

  if (totalMB > 400) {
    console.warn(`\n  ⚠️  WARNING: Storage at ${totalMB.toFixed(1)}MB — approaching 512MB Atlas free tier limit`)
  } else {
    console.log(`\n  ✅ Storage healthy: ${totalMB.toFixed(1)}MB / 512MB`)
  }

  console.log(`\n  Results: ${JSON.stringify(results)}`)
  console.log(`[${new Date().toISOString()}] Lifecycle job complete\n`)

  await mongoose.disconnect()
  process.exit(0)
}

run().catch(err => {
  console.error('Lifecycle job failed:', err)
  process.exit(1)
})
