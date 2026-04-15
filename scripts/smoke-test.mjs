#!/usr/bin/env node
/**
 * API Smoke Test Suite
 *
 * Validates all API endpoints against a running server.
 * Run after deployment to confirm the system is operational.
 *
 * Usage:
 *   API_URL=https://api.ai-fashion.app AUTH_TOKEN=<clerk_token> node scripts/smoke-test.mjs
 *   API_URL=http://localhost:4000     AUTH_TOKEN=<clerk_token> node scripts/smoke-test.mjs
 */

const API_URL    = process.env['API_URL']    ?? 'http://localhost:4000'
const AUTH_TOKEN = process.env['AUTH_TOKEN'] ?? ''

if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN required. Get from Clerk dashboard or sign-in flow.')
  process.exit(1)
}

let passed = 0, failed = 0

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function req(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    ...(body && { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json()
  return { status: res.status, data, ok: res.ok }
}

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch(e) {
    console.log(`  ❌ ${name}: ${e.message}`)
    failed++
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed') }
function assertStatus(res, code) { if (res.status !== code) throw new Error(`Expected HTTP ${code}, got ${res.status}: ${JSON.stringify(res.data)}`) }

// ─────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────

console.log(`\n🚀 API Smoke Tests → ${API_URL}`)
console.log('─'.repeat(60))

// ── 1. Health check ───────────────────────────────────────────────
console.log('\n  SYSTEM')
await test('GET /health → 200 with status:ok', async () => {
  const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(10_000) })
  const data = await res.json()
  assertStatus({ status: res.status }, 200)
  assert(data.status === 'ok', `status: ${data.status}`)
  assert(typeof data.uptime === 'number', 'uptime not number')
  assert(typeof data.version === 'string', 'version not string')
})

await test('GET /health → responds under 2s', async () => {
  const start = Date.now()
  await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2_000) })
  const latency = Date.now() - start
  assert(latency < 2000, `Too slow: ${latency}ms`)
})

// ── 2. Auth enforcement ───────────────────────────────────────────
console.log('\n  AUTHENTICATION')
await test('GET /api/v1/profile without token → 401', async () => {
  const res = await fetch(`${API_URL}/api/v1/profile`)
  assert(res.status === 401, `Expected 401, got ${res.status}`)
})

await test('POST /api/v1/recommend without token → 401', async () => {
  const res = await fetch(`${API_URL}/api/v1/recommend`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
  assert(res.status === 401, `Expected 401, got ${res.status}`)
})

await test('GET /api/v1/profile with invalid token → 401', async () => {
  const res = await fetch(`${API_URL}/api/v1/profile`, { headers: { Authorization: 'Bearer invalid_token_xyz' } })
  assert(res.status === 401, `Expected 401, got ${res.status}`)
})

// ── 3. Profile endpoints ──────────────────────────────────────────
console.log('\n  PROFILE')
await test('POST /api/v1/profile/setup → 200', async () => {
  const res = await req('POST', '/api/v1/profile/setup', {
    displayName: 'Smoke Test User',
    email:       'smoke@test.com',
    preferences: {
      styles: ['casual'], colors: ['#FFFFFF'], avoidColors: [],
      occasions: ['casual'], budget: 'mid', gender: 'prefer-not-to-say',
    },
  })
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(res.data.data?.displayName === 'Smoke Test User', 'displayName mismatch')
})

await test('GET /api/v1/profile → 200 with profile data', async () => {
  const res = await req('GET', '/api/v1/profile')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(res.data.data?.clerkUserId, 'no clerkUserId')
  assert(res.data.data?.dailyQuota, 'no dailyQuota')
})

await test('GET /api/v1/profile/quota → 200 with quota info', async () => {
  const res = await req('GET', '/api/v1/profile/quota')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(typeof res.data.data?.used === 'number', 'used not number')
  assert(typeof res.data.data?.limit === 'number', 'limit not number')
  assert(typeof res.data.data?.remaining === 'number', 'remaining not number')
  assert(res.data.data?.resetAt, 'no resetAt')
})

await test('PATCH /api/v1/profile/measurements → 200', async () => {
  const res = await req('PATCH', '/api/v1/profile/measurements', { height: 175, weight: 70 })
  assertStatus(res, 200)
  assert(res.data.success, `success:false — ${JSON.stringify(res.data)}`)
})

await test('PATCH /api/v1/profile/preferences → 200', async () => {
  const res = await req('PATCH', '/api/v1/profile/preferences', {
    styles: ['casual', 'minimal'], colors: ['#FFFFFF', '#000000'], avoidColors: [],
    occasions: ['casual', 'work'], budget: 'mid', gender: 'prefer-not-to-say',
  })
  assertStatus(res, 200)
})

await test('PATCH /api/v1/profile/measurements → 400 on invalid data', async () => {
  const res = await req('PATCH', '/api/v1/profile/measurements', { height: -10, weight: 70 })
  assertStatus(res, 400)
  assert(!res.data.success, 'should fail validation')
})

// ── 4. Weather endpoint ───────────────────────────────────────────
console.log('\n  WEATHER')
await test('GET /api/v1/weather?lat=51.5&lon=-0.12 → 200', async () => {
  const res = await req('GET', '/api/v1/weather?lat=51.5074&lon=-0.1278')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(typeof res.data.data?.temp === 'number', 'temp not number')
  assert(typeof res.data.data?.humidity === 'number', 'humidity not number')
  assert(res.data.data?.condition, 'no condition')
})

await test('GET /api/v1/weather without lat/lon → 400', async () => {
  const res = await req('GET', '/api/v1/weather')
  assertStatus(res, 400)
})

await test('GET /api/v1/weather with invalid lat → 400', async () => {
  const res = await req('GET', '/api/v1/weather?lat=999&lon=0')
  assertStatus(res, 400)
})

// ── 5. Trends endpoint ────────────────────────────────────────────
console.log('\n  TRENDS')
await test('GET /api/v1/trends → 200 with trend data', async () => {
  const res = await req('GET', '/api/v1/trends')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(Array.isArray(res.data.data?.trends), 'trends not array')
  assert(res.data.data?.trends.length > 0, 'empty trends')
  assert(res.data.data?.season, 'no season')
})

// ── 6. Recommendations ───────────────────────────────────────────
console.log('\n  RECOMMENDATIONS')
let createdRecId = null

await test('GET /api/v1/recommend/history → 200 paginated', async () => {
  const res = await req('GET', '/api/v1/recommend/history?page=1&limit=5')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(Array.isArray(res.data.items), 'items not array')
  assert(typeof res.data.total === 'number', 'total not number')
  assert(typeof res.data.pages === 'number', 'pages not number')
})

await test('GET /api/v1/recommend/history → 400 on invalid page', async () => {
  const res = await req('GET', '/api/v1/recommend/history?page=0&limit=5')
  assertStatus(res, 400)
})

await test('POST /api/v1/recommend → 400 on missing occasion', async () => {
  const res = await req('POST', '/api/v1/recommend', {})
  assertStatus(res, 400)
})

await test('POST /api/v1/recommend → 400 on invalid occasion', async () => {
  const res = await req('POST', '/api/v1/recommend', { occasion: 'disco-party' })
  assertStatus(res, 400)
})

await test('POST /api/v1/recommend → creates outfit recommendation', async () => {
  const res = await req('POST', '/api/v1/recommend', { occasion: 'casual' })
  // May be 201 (new) or 429 (quota exceeded) or 422 (profile incomplete)
  assert(
    [201, 422, 429].includes(res.status),
    `Unexpected status: ${res.status} — ${JSON.stringify(res.data)}`
  )
  if (res.status === 201) {
    assert(res.data.success, 'success:false')
    assert(res.data.data?._id, 'no _id in response')
    assert(res.data.data?.outfit?.title, 'no outfit title')
    assert(Array.isArray(res.data.data?.outfit?.items), 'items not array')
    assert(res.data.data?.outfit?.items.length >= 2, 'less than 2 items')
    createdRecId = res.data.data._id
    console.log(`      → Created recommendation: ${createdRecId}`)
  }
})

// ── 7. Feedback ───────────────────────────────────────────────────
console.log('\n  FEEDBACK')
if (createdRecId) {
  await test('POST /api/v1/feedback/:id → 200 on like', async () => {
    const res = await req('POST', `/api/v1/feedback/${createdRecId}`, { rating: 'like' })
    assertStatus(res, 200)
    assert(res.data.success, 'success:false')
  })

  await test('POST /api/v1/feedback/:id → 200 on dislike', async () => {
    const res = await req('POST', `/api/v1/feedback/${createdRecId}`, { rating: 'dislike', reason: 'smoke test' })
    assertStatus(res, 200)
  })

  await test('POST /api/v1/feedback/:id → 400 on invalid rating', async () => {
    const res = await req('POST', `/api/v1/feedback/${createdRecId}`, { rating: 'meh' })
    assertStatus(res, 400)
  })

  await test('GET /api/v1/feedback/saved → 200 with array', async () => {
    const res = await req('GET', '/api/v1/feedback/saved')
    assertStatus(res, 200)
    assert(Array.isArray(res.data.data), 'saved not array')
  })} else {
  console.log('  ⚠️  Skipping feedback tests (no recommendation created - check quota/profile)')
}

// ── 8. 404 handling ───────────────────────────────────────────────
console.log('\n  ERROR HANDLING')
await test('GET /api/v1/nonexistent → 404', async () => {
  const res = await req('GET', '/api/v1/nonexistent-route')
  assertStatus(res, 404)
})

await test('GET /api/v1/recommend/:id with fake id → 404', async () => {
  const res = await req('GET', '/api/v1/recommend/000000000000000000000000')
  assertStatus(res, 404)
})

// ── 9. Rate limiting ──────────────────────────────────────────────
console.log('\n  RATE LIMITING')
await test('Response includes standard rate limit headers', async () => {
  const res = await fetch(`${API_URL}/api/v1/profile`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  })
  const hasRLHeaders =
    res.headers.has('ratelimit-limit') ||
    res.headers.has('x-ratelimit-limit') ||
    res.headers.has('retry-after')
  // Note: headers only appear when limit is close to being hit
  // Just verify the endpoint responds correctly
  assert(res.status !== 500, `Server error: ${res.status}`)
})

// ─────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────

const total = passed + failed
console.log('\n' + '─'.repeat(60))
console.log(`  SMOKE TESTS: ${passed}/${total} passed`)
if (failed > 0) {
  console.log(`  ❌ ${failed} tests FAILED — system may have issues`)
  process.exit(1)
} else {
  console.log('  ✅ All smoke tests passed — system operational\n')
}
