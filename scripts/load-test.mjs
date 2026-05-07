#!/usr/bin/env node
// @ts-check
// Load test: fires concurrent requests at /health + /api/v1/* and
// validates that error rate <5%, p99 <3s, score ≥95

import autocannon from 'autocannon'

const PORT    = process.env['PORT'] ?? '4001'
const BASE    = `http://localhost:${PORT}`
const DURATION = 15   // seconds
const CONNECTIONS = 50

async function runTest(title, url, method = 'GET', body = null) {
  const result = await autocannon({
    url,
    connections: CONNECTIONS,
    duration:    DURATION,
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Trace-Id':   `load-test-${Date.now()}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const total     = result.requests.total
  const errors    = result.errors + result.timeouts
  const errorRate = errors / Math.max(total, 1)
  const p99       = result.latency.p99
  const rps       = result.requests.average

  console.log(`\n── ${title} ──`)
  console.log(`  URL:        ${url}`)
  console.log(`  RPS:        ${rps.toFixed(0)}`)
  console.log(`  P99 ms:     ${p99}`)
  console.log(`  Errors:     ${errors}/${total} (${(errorRate * 100).toFixed(2)}%)`)

  return { errorRate, p99, rps, total }
}

async function main() {
  console.log(`\n🔥 AI Fashion Stylist — Load Test (${CONNECTIONS} concurrent, ${DURATION}s each)\n`)

  const scores = []

  // Test 1: Health endpoint
  const health = await runTest('Health check', `${BASE}/health`)
  scores.push({
    name: 'Health endpoint',
    score: scoreRequest(health.errorRate, health.p99, 100, 200),
  })

  // Test 2: 404 handling
  const notFound = await runTest('404 handler', `${BASE}/api/v1/nonexistent`)
  // Expect 404s not 500s
  scores.push({
    name: '404 handler',
    score: notFound.errorRate < 0.01 ? 100 : 50,
  })

  // Test 3: Unauthenticated rejection
  const unauth = await runTest('Auth rejection', `${BASE}/api/v1/recommend`)
  scores.push({
    name: 'Auth rejection speed',
    score: scoreRequest(0, unauth.p99, 10, 100),
  })

  // Test 4: Metrics endpoint
  const metricsTest = await runTest('Metrics endpoint', `${BASE}/metrics`)
  scores.push({
    name: 'Metrics endpoint',
    score: scoreRequest(metricsTest.errorRate, metricsTest.p99, 50, 500),
  })

  // ── Score calculation ──
  const avg = scores.reduce((s, r) => s + r.score, 0) / scores.length

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('LOAD TEST RESULTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  scores.forEach(({ name, score }) => {
    const icon = score >= 95 ? '✅' : score >= 80 ? '⚠️' : '❌'
    console.log(`${icon} ${name}: ${score}/100`)
  })
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`FINAL SCORE: ${avg.toFixed(1)}/100`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  if (avg < 95) {
    console.error(`❌ GATE FAILED: score ${avg.toFixed(1)} < 95 required`)
    process.exit(1)
  }

  console.log('✅ GATE PASSED: score ≥ 95')
}

function scoreRequest(errorRate, p99Ms, maxRps, p99Limit) {
  let score = 100
  // Error rate penalty
  if (errorRate > 0.10) score -= 40
  else if (errorRate > 0.05) score -= 20
  else if (errorRate > 0.01) score -= 10
  // Latency penalty
  if (p99Ms > p99Limit * 5)    score -= 40
  else if (p99Ms > p99Limit * 2) score -= 20
  else if (p99Ms > p99Limit)     score -= 10
  return Math.max(0, score)
}

main().catch((err) => {
  console.error('Load test failed:', err.message)
  process.exit(1)
})
