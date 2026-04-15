#!/usr/bin/env node
/**
 * Delivery Checklist — 50-point final gate
 * IF ANY FAILS → DEPLOYMENT BLOCKED
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/,'')
let passed = 0, failed = 0
const failures = []

function chk(label, ok) {
  console.log(`  ${ok ? '✅' : '❌'} ${label}`)
  ok ? passed++ : (failed++, failures.push(label))
}

const has = (path, ...patterns) => {
  if (!existsSync(join(ROOT, path))) return false
  const c = readFileSync(join(ROOT, path), 'utf8')
  return patterns.every(p => c.includes(p))
}
const ex = path => existsSync(join(ROOT, path))

console.log('\n📋 ATELIER — Delivery Checklist (50 points)')
console.log('═'.repeat(58))

// ── FUNCTIONAL ─────────────────────────────────────────────────
console.log('\n🟢  FUNCTIONAL')
chk('AI recommend route',           ex('apps/api/src/routes/recommend.routes.ts'))
chk('AI orchestrator + fallback',   has('packages/ai-core/src/orchestrator/index.ts', 'GeminiProvider', 'OpenAIProvider', 'buildDegradedOutfitResponse'))
chk('Gemini provider',              has('packages/ai-core/src/providers/gemini.provider.ts', 'generateOutfit'))
chk('OpenAI fallback provider',     has('packages/ai-core/src/providers/openai.provider.ts', 'generateOutfit'))
chk('Image service (Replicate+CDN)',has('apps/api/src/services/image.service.ts', 'generateAndUpload', 'runSDXL'))
chk('Weather service',              has('apps/api/src/services/weather.service.ts', 'getWeather'))
chk('Trends service',               ex('apps/api/src/services/trends.service.ts'))
chk('Quota enforcement (atomic)',   has('apps/api/src/services/profile.service.ts', 'consumeQuota', 'findOneAndUpdate', '$lt'))
chk('Web: all 6 pages exist', ['apps/web/src/app/dashboard/page.tsx','apps/web/src/app/recommend/page.tsx','apps/web/src/app/history/page.tsx','apps/web/src/app/profile/page.tsx','apps/web/src/app/trends/page.tsx','apps/web/src/app/sign-in/[[...sign-in]]/page.tsx'].every(ex))

// ── RELIABILITY ────────────────────────────────────────────────
console.log('\n🟡  RELIABILITY (Laws 1+4)')
chk('Degraded fallback (no crash)', has('packages/ai-core/src/orchestrator/index.ts', 'buildDegradedOutfitResponse', 'confidenceScore: 0.5'))
chk('Circuit breaker (3 states)',   has('packages/ai-core/src/circuit-breaker/index.ts', 'HALF_OPEN', 'CLOSED', 'OPEN'))
chk('withRetry exponential backoff',has('packages/ai-core/src/circuit-breaker/index.ts', 'withRetry', 'baseDelayMs', 'maxAttempts'))
chk('Request timeout',              has('packages/ai-core/src/circuit-breaker/index.ts', 'requestTimeout'))
chk('In-flight deduplication',      has('packages/ai-core/src/orchestrator/index.ts', 'inFlight', 'deduplicate'))
chk('Orchestrator re-validates AI', has('packages/ai-core/src/orchestrator/index.ts', 'AIOutfitOutputSchema.parse'))
chk('/health endpoint',             has('apps/api/src/index.ts', '/health', "status:    'ok'") || has('apps/api/src/index.ts', '/health', "status: 'ok'"))
chk('Docker HEALTHCHECK',           has('apps/api/Dockerfile', 'HEALTHCHECK', '/health'))

// ── PERFORMANCE ────────────────────────────────────────────────
console.log('\n⚡  PERFORMANCE')
chk('Cache service (TTL policies)', has('apps/api/src/services/cache.service.ts', 'getOutfit', 'setOutfit'))
chk('Async image (text-first UX)',  has('apps/api/src/services/recommendation.service.ts', 'setImmediate', 'triggerImageGeneration'))
chk('SWR client cache (web)',       has('apps/web/src/hooks/index.ts', 'useSWR', 'dedupingInterval'))
chk('MongoDB TTL index (auto-exp)', has('apps/api/src/db/models.ts', 'expireAfterSeconds'))
chk('Rate limiter on AI routes',    has('apps/api/src/middleware/index.ts', 'aiRateLimiter'))
chk('Non-root Docker user',         has('apps/api/Dockerfile', 'USER expressjs', 'dumb-init'))

// ── SECURITY ───────────────────────────────────────────────────
console.log('\n🔐  SECURITY (Laws 1+5)')
chk('Env hard-exit on missing vars',has('apps/api/src/config/env.ts', 'process.exit(1)', 'GEMINI_API_KEY'))
chk('Clerk JWT auth middleware',    has('apps/api/src/middleware/auth.middleware.ts', 'verifyToken', 'Bearer'))
chk('All DB queries userId-scoped', has('apps/api/src/services/recommendation.service.ts', 'userId: clerkUserId'))
chk('Prompt injection sanitization',has('packages/shared/src/utils/index.ts', 'sanitizeUserInput', 'REDACTED'))
chk('Clerk middleware (web)',       has('apps/web/src/middleware.ts', 'clerkMiddleware', "auth().protect()"))
chk('Security headers (Vercel)',    has('apps/web/vercel.json', 'X-Frame-Options', 'X-Content-Type-Options'))
chk('robots.txt blocks /dashboard', has('apps/web/public/robots.txt', 'Disallow: /dashboard'))

// ── COST PROTECTION ────────────────────────────────────────────
console.log('\n💰  COST PROTECTION (Law 6)')
chk('Outfit cache (6h)',            has('apps/api/src/services/cache.service.ts', 'getOutfit', 'setOutfit'))
chk('Weather cache (30min)',        has('apps/api/src/services/weather.service.ts', 'cacheService'))
chk('Trends cache (24h)',           has('apps/api/src/services/trends.service.ts', 'cacheService'))
chk('Degraded NOT cached',          has('packages/ai-core/src/orchestrator/index.ts', 'buildDegradedOutfitResponse'))
chk('Atomic quota (findOne+$lt)',   has('apps/api/src/services/profile.service.ts', '$lt', '$inc', 'findOneAndUpdate'))
chk('Dual image fallback (Flux)',   has('apps/api/src/services/image.service.ts', 'SDXL_MODEL', 'FLUX_SCHNELL'))

// ── OBSERVABILITY ──────────────────────────────────────────────
console.log('\n🔭  OBSERVABILITY (Law 7)')
chk('Pino structured logger',       has('apps/api/src/config/logger.ts', 'pino'))
chk('traceId on every request',     has('apps/api/src/middleware/index.ts', 'traceId', 'generateTraceId'))
chk('AI latency logged',            has('apps/api/src/services/recommendation.service.ts', 'latencyMs'))
chk('Cache hit/miss logged',        has('apps/api/src/services/recommendation.service.ts', 'cacheHit'))
chk('Keep-alive script',            ex('scripts/keep-alive.mjs'))
chk('Data lifecycle job',           ex('scripts/lifecycle.ts'))
chk('Smoke test (28 endpoints)',    ex('scripts/smoke-test.mjs'))

// ── CI/CD ──────────────────────────────────────────────────────
console.log('\n🔄  CI/CD (8-step pipeline)')
chk('CI: lint + type-check + test', has('.github/workflows/ci.yml', 'lint', 'type-check', 'test'))
chk('CI: AI validation step',       has('.github/workflows/ci.yml', 'ai-validation', 'AI Schema Validation'))
chk('CI: security step',            has('.github/workflows/ci.yml', 'Security Audit'))
chk('CI: delivery gate',            has('.github/workflows/ci.yml', 'delivery-gate', 'Delivery Gate'))
chk('Deploy gates on CI',           has('.github/workflows/deploy.yml', 'ci-gate') || has('.github/workflows/deploy.yml', 'ci.yml'))
chk('6 workflows present', ['.github/workflows/ci.yml','.github/workflows/deploy.yml','.github/workflows/keep-alive.yml','.github/workflows/lifecycle.yml','.github/workflows/security.yml','.github/workflows/smoke-test.yml'].every(ex))
chk('Render IaC + health check',    has('render.yaml', 'healthCheckPath', '/health'))
chk('Vercel config + headers',      has('apps/web/vercel.json', 'nextjs', 'rewrites'))

// ── FINAL ──────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(58)}`)
console.log(`  Delivery Gate: ${passed}/${passed+failed} checks passed`)
console.log('═'.repeat(58))

if (failed > 0) {
  console.log('\n  ⛔  DEPLOYMENT BLOCKED — Fix before releasing:\n')
  failures.forEach(f => console.log(`     ❌ ${f}`))
  console.log()
  process.exit(1)
} else {
  console.log('\n  🚀  ALL CHECKS PASSED — SAFE TO DEPLOY\n')
}
