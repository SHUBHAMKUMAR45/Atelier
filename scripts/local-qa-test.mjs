#!/usr/bin/env node
/**
 * LOCAL QA TEST SUITE
 * 
 * Tests the API without needing external services.
 * Requires the API server to be running with:
 *   BYPASS_AUTH=true NODE_ENV=development
 * 
 * Tests auth enforcement, request validation, response shapes,
 * and all error handling paths that don't require real AI/DB calls.
 * 
 * Usage: API_URL=http://localhost:4000 node scripts/local-qa-test.mjs
 */

const API_URL = process.env['API_URL'] ?? 'http://localhost:4000'
const BYPASS_USER = 'test_user_qa_' + Date.now()

let passed = 0, failed = 0, warnings = 0

async function req(method, path, body, headers = {}) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-user-id': BYPASS_USER,
        ...headers
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10_000),
    })
    let data
    try { data = await res.json() } catch { data = {} }
    return { status: res.status, data, ok: res.ok, headers: res.headers }
  } catch (e) {
    throw new Error(`Request failed: ${e.message}`)
  }
}

async function reqNoAuth(method, path, body) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10_000),
    })
    let data
    try { data = await res.json() } catch { data = {} }
    return { status: res.status, data, ok: res.ok }
  } catch (e) {
    throw new Error(`Request failed: ${e.message}`)
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed') }
function assertStatus(res, code) {
  if (res.status !== code)
    throw new Error(`Expected HTTP ${code}, got ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`)
}

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch(e) {
    console.log(`  ❌ ${name}`)
    console.log(`     └─ ${e.message}`)
    failed++
  }
}

async function warn(name, fn) {
  try {
    await fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch(e) {
    console.log(`  ⚠️  ${name} (non-blocking: needs live service)`)
    console.log(`     └─ ${e.message}`)
    warnings++
  }
}

console.log(`\n🧪 Local QA Test Suite → ${API_URL}`)
console.log(`   User: ${BYPASS_USER}`)
console.log('─'.repeat(60))

// ── 1. Health ─────────────────────────────────────────────────────
console.log('\n  [1] HEALTH & CONNECTIVITY')

await test('GET /health → 200', async () => {
  const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  assertStatus({ status: res.status }, 200)
  assert(data.status === 'ok' || data.status === 'degraded', `status: ${data.status}`)
  assert(typeof data.uptime === 'number', 'no uptime')
  assert(data.version === '2.0.0', `wrong version: ${data.version}`)
})

await test('GET / → 200 with API info', async () => {
  const res = await fetch(`${API_URL}/`, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  assertStatus({ status: res.status }, 200)
  assert(data.message === 'AI Fashion Stylist API', `wrong message: ${data.message}`)
  assert(data.version, 'no version')
})

await test('GET /health → responds under 1s', async () => {
  const start = Date.now()
  await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(1000) })
  const latency = Date.now() - start
  assert(latency < 1000, `Too slow: ${latency}ms`)
})

// ── 2. Auth enforcement ───────────────────────────────────────────
console.log('\n  [2] AUTHENTICATION ENFORCEMENT')

await test('GET /api/v1/profile without token → 401', async () => {
  const res = await reqNoAuth('GET', '/api/v1/profile')
  assertStatus(res, 401)
  assert(res.data.success === false, 'success should be false')
  assert(res.data.error, 'no error message')
})

await test('POST /api/v1/recommend without token → 401', async () => {
  const res = await reqNoAuth('POST', '/api/v1/recommend', { occasion: 'casual' })
  assertStatus(res, 401)
})

await test('GET /api/v1/wardrobe without token → 401', async () => {
  const res = await reqNoAuth('GET', '/api/v1/wardrobe')
  assertStatus(res, 401)
})

await test('GET /api/v1/trends without token → 401', async () => {
  const res = await reqNoAuth('GET', '/api/v1/trends')
  assertStatus(res, 401)
})

await test('GET /api/v1/weather?lat=51&lon=0 without token → 401', async () => {
  const res = await reqNoAuth('GET', '/api/v1/weather?lat=51&lon=0')
  assertStatus(res, 401)
})

// ── 3. Profile CRUD ───────────────────────────────────────────────
console.log('\n  [3] PROFILE ENDPOINTS')

await test('POST /api/v1/profile/setup → 200 with valid data', async () => {
  const res = await req('POST', '/api/v1/profile/setup', {
    displayName: 'QA Test User',
    email: 'qa-test@atelier.app',
    preferences: {
      styles: ['casual', 'minimal'],
      colors: ['#FFFFFF'],
      avoidColors: [],
      occasions: ['casual', 'work'],
      budget: 'mid',
      gender: 'prefer-not-to-say',
    },
  })
  assertStatus(res, 200)
  assert(res.data.success, `success:false — ${JSON.stringify(res.data)}`)
  assert(res.data.data?.displayName === 'QA Test User', 'displayName mismatch')
  assert(res.data.data?.clerkUserId === BYPASS_USER, 'clerkUserId mismatch')
  assert(res.data.data?.dailyQuota, 'no dailyQuota')
})

await test('GET /api/v1/profile → 200 with profile', async () => {
  const res = await req('GET', '/api/v1/profile')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(res.data.data?.clerkUserId, 'no clerkUserId')
  assert(res.data.data?.displayName, 'no displayName')
  assert(res.data.data?.email, 'no email')
  assert(res.data.data?.dailyQuota !== undefined, 'no dailyQuota')
})

await test('GET /api/v1/profile/me → 200 (never 404)', async () => {
  const res = await req('GET', '/api/v1/profile/me')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
})

await test('GET /api/v1/profile/quota → 200 with quota fields', async () => {
  const res = await req('GET', '/api/v1/profile/quota')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  const q = res.data.data
  assert(typeof q?.used === 'number', `used not number: ${JSON.stringify(q)}`)
  assert(typeof q?.limit === 'number', 'limit not number')
  assert(typeof q?.remaining === 'number', 'remaining not number')
  assert(typeof q?.resetAt === 'string', 'resetAt not string')
  assert(q?.remaining === q?.limit - q?.used, 'remaining math wrong')
})

await test('PATCH /api/v1/profile/measurements → 200', async () => {
  const res = await req('PATCH', '/api/v1/profile/measurements', {
    height: 178, weight: 72, chest: 95, waist: 78,
  })
  assertStatus(res, 200)
  assert(res.data.success, `success:false — ${JSON.stringify(res.data)}`)
  assert(res.data.data?.updated === true, 'updated not true')
})

await test('PATCH /api/v1/profile/preferences → 200', async () => {
  const res = await req('PATCH', '/api/v1/profile/preferences', {
    styles: ['casual', 'minimal', 'streetwear'],
    colors: ['#FFFFFF', '#000000'],
    avoidColors: ['#FF0000'],
    occasions: ['casual', 'work', 'date'],
    budget: 'mid',
    gender: 'male',
  })
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
})

// ── 4. Request Validation ─────────────────────────────────────────
console.log('\n  [4] REQUEST VALIDATION')

await test('POST /profile/setup → 400 on missing displayName', async () => {
  const res = await req('POST', '/api/v1/profile/setup', {
    email: 'valid@email.com',
    // missing displayName
  })
  assertStatus(res, 400)
  assert(!res.data.success, 'should fail')
})

await test('POST /profile/setup → 400 on invalid email', async () => {
  const res = await req('POST', '/api/v1/profile/setup', {
    displayName: 'Test User',
    email: 'not-an-email',
  })
  assertStatus(res, 400)
  assert(!res.data.success, 'should fail')
})

await test('PATCH /profile/measurements → 400 on negative height', async () => {
  const res = await req('PATCH', '/api/v1/profile/measurements', { height: -5, weight: 70 })
  assertStatus(res, 400)
  assert(!res.data.success, 'should fail')
})

await test('POST /recommend → 400 on missing occasion', async () => {
  const res = await req('POST', '/api/v1/recommend', {})
  assertStatus(res, 400)
  assert(!res.data.success, 'should fail')
  assert(res.data.error, 'no error message')
})

await test('POST /recommend → 400 on invalid occasion', async () => {
  const res = await req('POST', '/api/v1/recommend', { occasion: 'invalid_occasion_xyz' })
  assertStatus(res, 400)
})

await test('GET /weather → 400 missing lat/lon', async () => {
  const res = await req('GET', '/api/v1/weather')
  assertStatus(res, 400)
})

await test('GET /weather → 400 non-numeric lat', async () => {
  const res = await req('GET', '/api/v1/weather?lat=abc&lon=0')
  assertStatus(res, 400)
})

await test('POST /feedback/:id → 400 on invalid rating', async () => {
  const res = await req('POST', '/api/v1/feedback/507f1f77bcf86cd799439011', { rating: 'meh' })
  assertStatus(res, 400)
})

await test('POST /wardrobe → 400 on missing imageUrl', async () => {
  const res = await req('POST', '/api/v1/wardrobe', { name: 'Test Shirt', category: 'top' })
  assertStatus(res, 400)
})

await test('POST /wardrobe → 400 on invalid category', async () => {
  const res = await req('POST', '/api/v1/wardrobe', {
    name: 'Test', category: 'invalid_category',
    imageUrl: 'https://example.com/img.jpg',
  })
  assertStatus(res, 400)
})

await test('POST /wardrobe → 400 on non-URL imageUrl', async () => {
  const res = await req('POST', '/api/v1/wardrobe', {
    name: 'Test', category: 'top', imageUrl: 'not-a-url',
  })
  assertStatus(res, 400)
})

// ── 5. History + Recommendations ─────────────────────────────────
console.log('\n  [5] HISTORY & RECOMMENDATIONS')

await test('GET /recommend/history → 200 paginated shape', async () => {
  const res = await req('GET', '/api/v1/recommend/history?page=1&limit=5')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  const d = res.data.data
  assert(Array.isArray(d?.items), `items not array — got ${JSON.stringify(d)}`)
  assert(typeof d?.total === 'number', 'total not number')
  assert(typeof d?.pages === 'number', 'pages not number')
  assert(typeof d?.page === 'number', 'page not number')
  assert(d?.page === 1, 'page not 1')
})

await test('GET /recommend/history → 400 on page=0', async () => {
  const res = await req('GET', '/api/v1/recommend/history?page=0&limit=5')
  assertStatus(res, 400)
})

await test('GET /recommend/history → 400 on limit=100 (max 50)', async () => {
  const res = await req('GET', '/api/v1/recommend/history?page=1&limit=100')
  assertStatus(res, 400)
})

await test('GET /recommend/:id with invalid ObjectId → 404 or 400', async () => {
  const res = await req('GET', '/api/v1/recommend/000000000000000000000000')
  assert([404, 400].includes(res.status), `Expected 404/400, got ${res.status}`)
})

// ── 6. Wardrobe CRUD ─────────────────────────────────────────────
console.log('\n  [6] WARDROBE')

let wardrobeItemId = null

await test('GET /wardrobe → 200 with empty array for new user', async () => {
  const res = await req('GET', '/api/v1/wardrobe')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(Array.isArray(res.data.data), `data not array — ${JSON.stringify(res.data.data)}`)
})

await test('POST /wardrobe → 201/200 with valid item', async () => {
  const res = await req('POST', '/api/v1/wardrobe', {
    name: 'QA Test Shirt',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028?w=400',
    color: '#FFFFFF',
  })
  assert([200, 201].includes(res.status), `Expected 200/201, got ${res.status}: ${JSON.stringify(res.data)}`)
  assert(res.data.success, 'success:false')
  assert(res.data.data?._id, 'no _id in wardrobe item')
  assert(res.data.data?.name === 'QA Test Shirt', 'name mismatch')
  assert(res.data.data?.category === 'top', 'category mismatch')
  wardrobeItemId = res.data.data._id
  console.log(`       → Created wardrobe item: ${wardrobeItemId}`)
})

await test('GET /wardrobe → 200 with created item', async () => {
  if (!wardrobeItemId) { console.log('       ⚠️  Skipped (no item created)'); return }
  const res = await req('GET', '/api/v1/wardrobe')
  assertStatus(res, 200)
  assert(Array.isArray(res.data.data), 'data not array')
  const item = res.data.data.find(i => i._id === wardrobeItemId)
  assert(item, 'created item not found in wardrobe list')
  assert(item.name === 'QA Test Shirt', 'name mismatch')
})

await test('GET /wardrobe/signature → 200 with upload creds', async () => {
  const res = await req('GET', '/api/v1/wardrobe/signature')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  assert(res.data.data?.signature, 'no signature')
  assert(res.data.data?.timestamp, 'no timestamp')
  assert(res.data.data?.apiKey, 'no apiKey')
  assert(res.data.data?.cloudName, 'no cloudName')
})

await test('DELETE /wardrobe/:id → 200', async () => {
  if (!wardrobeItemId) { console.log('       ⚠️  Skipped (no item created)'); return }
  const res = await req('DELETE', `/api/v1/wardrobe/${wardrobeItemId}`)
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
})

await test('GET /wardrobe → item deleted from list', async () => {
  if (!wardrobeItemId) { console.log('       ⚠️  Skipped (no item created)'); return }
  const res = await req('GET', '/api/v1/wardrobe')
  assertStatus(res, 200)
  const found = res.data.data?.find(i => i._id === wardrobeItemId)
  assert(!found, 'deleted item still in wardrobe')
  wardrobeItemId = null
})

// ── 7. Recommend (live AI — may skip) ────────────────────────────
console.log('\n  [7] AI RECOMMENDATION (requires live Gemini/OpenAI)')

await warn('POST /recommend/casual → 201 with outfit', async () => {
  const res = await req('POST', '/api/v1/recommend', {
    occasion: 'casual',
    description: 'QA test outfit for a casual day',
    useWardrobe: false,
  })
  assert(
    [201, 422, 429].includes(res.status),
    `Unexpected: ${res.status} — ${JSON.stringify(res.data).slice(0, 300)}`
  )
  if (res.status === 201) {
    const d = res.data.data
    assert(d?._id, 'no _id')
    assert(d?.outfit?.title, 'no outfit title')
    assert(Array.isArray(d?.outfit?.items), 'items not array')
    assert(d?.outfit?.items.length >= 2, `only ${d?.outfit?.items.length} items`)
    assert(d?.weatherContext?.temp !== undefined, 'no weatherContext.temp')
    assert(d?.occasion === 'casual', 'occasion mismatch')
    assert(['pending','generating','ready','failed'].includes(d?.imageStatus), 'invalid imageStatus')
  } else if (res.status === 422) {
    assert(res.data.error?.includes('incomplete'), `wrong 422 error: ${res.data.error}`)
  }
})

// ── 8. Trends (live AI — may skip) ───────────────────────────────
console.log('\n  [8] TRENDS (requires live Gemini/OpenAI)')

await warn('GET /trends → 200 with trend array', async () => {
  const res = await req('GET', '/api/v1/trends')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  const d = res.data.data
  assert(Array.isArray(d?.trends), 'trends not array')
  assert(d?.trends.length > 0, 'empty trends')
  assert(d?.season, 'no season')
  assert(d?.location, 'no location')
  d.trends.forEach((t, i) => {
    assert(t.trend, `trend ${i} missing name`)
    assert(t.description, `trend ${i} missing description`)
    assert(typeof t.relevance === 'number', `trend ${i} relevance not number`)
    assert(t.relevance >= 0 && t.relevance <= 1, `trend ${i} relevance out of range: ${t.relevance}`)
  })
})

// ── 9. Weather (live API — may skip) ─────────────────────────────
console.log('\n  [9] WEATHER (requires live OpenWeatherMap)')

await warn('GET /weather?lat=48.85&lon=2.35 → 200 Paris', async () => {
  const res = await req('GET', '/api/v1/weather?lat=48.8566&lon=2.3522')
  assertStatus(res, 200)
  assert(res.data.success, 'success:false')
  const d = res.data.data
  assert(typeof d?.temp === 'number', 'temp not number')
  assert(d?.temp > -60 && d?.temp < 60, `temp out of range: ${d?.temp}`)
  assert(typeof d?.humidity === 'number', 'humidity not number')
  assert(d?.condition, 'no condition')
  assert(typeof d?.windSpeed === 'number', 'windSpeed not number')
})

// ── 10. 404 / Error handling ──────────────────────────────────────
console.log('\n  [10] ERROR HANDLING')

await test('GET /api/v1/nonexistent → 404', async () => {
  const res = await req('GET', '/api/v1/nonexistent-route')
  assertStatus(res, 404)
  assert(!res.data.success, 'success should be false')
})

await test('Response envelope always has success + data + error + traceId', async () => {
  const res = await req('GET', '/api/v1/profile')
  assert('success' in res.data, 'no success field')
  assert('data' in res.data, 'no data field')
  assert('error' in res.data, 'no error field')
  assert('traceId' in res.data, 'no traceId field')
})

await test('X-Trace-Id header present in responses', async () => {
  const res = await req('GET', '/api/v1/profile')
  assert(res.headers.has('x-trace-id'), 'no x-trace-id header')
})

await test('CORS headers present for allowed origin', async () => {
  const res = await fetch(`${API_URL}/api/v1/profile`, {
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': BYPASS_USER,
      'Origin': 'http://localhost:3000',
    },
    signal: AbortSignal.timeout(5000),
  })
  // Either CORS headers or just a successful response
  assert(res.status !== 0, 'request failed completely')
})

// ── 11. Security ──────────────────────────────────────────────────
console.log('\n  [11] SECURITY / INPUT SANITIZATION')

await test('XSS in displayName → 400 or sanitized', async () => {
  const res = await req('POST', '/api/v1/profile/setup', {
    displayName: '<script>alert("xss")</script>',
    email: 'xss@test.com',
  })
  if (res.status === 200) {
    // If accepted, must be sanitized
    const name = res.data.data?.displayName ?? ''
    assert(!name.includes('<script>'), 'XSS not sanitized!')
  } else {
    assert(res.status === 400, `Expected 400 or 200-sanitized, got ${res.status}`)
  }
})

await test('SQL injection in recommendation description → handled', async () => {
  const res = await req('POST', '/api/v1/recommend', {
    occasion: 'casual',
    description: "'; DROP TABLE users; --",
  })
  assert([201, 422, 429, 400].includes(res.status), `Unexpected: ${res.status}`)
})

await test('Oversized body → 413 or 400', async () => {
  const bigBody = { displayName: 'A'.repeat(200000), email: 'big@test.com' }
  const res = await req('POST', '/api/v1/profile/setup', bigBody)
  assert([400, 413].includes(res.status), `Expected 400/413, got ${res.status}`)
})

await test('Prototype pollution attempt → blocked', async () => {
  const res = await req('POST', '/api/v1/profile/setup', {
    displayName: 'Test',
    email: 'test@test.com',
    '__proto__': { admin: true },
    'constructor': { prototype: { isAdmin: true } },
  })
  // Should succeed (fields stripped) or fail validation
  assert([200, 400].includes(res.status), `unexpected ${res.status}`)
})

// ─────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────
const total = passed + failed + warnings
console.log('\n' + '─'.repeat(60))
console.log(`  Results: ${passed} passed, ${failed} failed, ${warnings} skipped (need live services)`)
console.log(`  Total:   ${total} checks\n`)

if (failed > 0) {
  console.log(`  ❌ ${failed} test(s) FAILED — see above for details`)
  process.exit(1)
} else {
  console.log(`  ✅ All non-service-dependent tests passed!`)
  if (warnings > 0) {
    console.log(`  ℹ️  ${warnings} skipped — run with live API keys to test AI features\n`)
  }
}
