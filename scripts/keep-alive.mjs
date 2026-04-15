#!/usr/bin/env node
/**
 * keep-alive.mjs — Prevents Render free-tier cold starts
 * by pinging /health every 10 minutes.
 *
 * Run this from a separate cron service or GitHub Actions schedule.
 *
 * Usage:
 *   node scripts/keep-alive.mjs
 *
 * Or add to GitHub Actions:
 *   - cron: '* /10 * * * *'    # every 10 minutes
 */

const API_URL = process.env['API_URL'] ?? 'https://api.ai-fashion.app'
const TIMEOUT  = 8_000

async function ping() {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)

    const res = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    const latency = Date.now() - start
    const body    = await res.json()

    if (res.ok) {
      console.log(`[${new Date().toISOString()}] ✅ OK  ${latency}ms — ${JSON.stringify(body)}`)
    } else {
      console.error(`[${new Date().toISOString()}] ⚠️  ${res.status} in ${latency}ms`)
      process.exitCode = 1
    }
  } catch (err) {
    const latency = Date.now() - start
    console.error(`[${new Date().toISOString()}] ❌ FAILED in ${latency}ms —`, err.message)
    process.exitCode = 1
  }
}

ping()
