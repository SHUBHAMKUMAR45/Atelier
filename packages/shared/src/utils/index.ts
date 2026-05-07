// Removed top-level import { createHash } from 'crypto' to fix Webpack runtime errors

// ─────────────────────────────────────────────────────────────────
// HASH UTILITIES
// ─────────────────────────────────────────────────────────────────

/**
 * Browser-safe hashing utility.
 * Uses Node's crypto in server environments and a simple fallback in browsers.
 */
export function hashCacheKey(parts: Record<string, unknown>): string {
  const normalized = JSON.stringify(parts, Object.keys(parts).sort())
  
  try {
    // Use dynamic require to prevent Webpack initialization errors when crypto is false
    if (typeof window === 'undefined') {
      const crypto = require('crypto')
      if (crypto && typeof crypto.createHash === 'function') {
        return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32)
      }
    }
  } catch (err) {
    // Fallback below
  }

  // Simple deterministic fallback for browser environments (DJB2-like)
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return `b-${Math.abs(hash).toString(16).padStart(30, '0')}`
}

export function hashRequestId(
  userId: string,
  occasion: string,
  weatherSnapshot: { temp: number; condition: string },
  profileSnapshot: { budget: string; styles: string[] },
  useWardrobe = false,
): string {
  // Bucket temperature to nearest 5°C to increase cache hits
  const tempBucket = Math.round(weatherSnapshot.temp / 5) * 5
  return hashCacheKey({
    userId,
    occasion,
    temp:      tempBucket,
    condition: weatherSnapshot.condition,
    budget:    profileSnapshot.budget,
    styles:    [...profileSnapshot.styles].sort(),
    useWardrobe,
  })
}

// ─────────────────────────────────────────────────────────────────
// INPUT SANITIZATION (Prompt Injection Defense)
// ─────────────────────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|above)\s+instructions?/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a|an)?/gi,
  /forget\s+(everything|all)/gi,
  /\[\s*system\s*\]/gi,
  /<\s*system\s*>/gi,
  /###\s*instruction/gi,
  /prompt\s*injection/gi,
  /jailbreak/gi,
  /DAN\s*mode/gi,
  /do\s+anything\s+now/gi,
]

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
const MAX_FIELD_LENGTH = 500

export function sanitizeString(input: string, maxLen = MAX_FIELD_LENGTH): string {
  // 1. Truncate
  let cleaned = input.slice(0, maxLen)
  // 2. Remove control characters
  cleaned = cleaned.replace(CONTROL_CHARS, '')
  // 3. Neutralize injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]')
  }
  // 4. Trim whitespace
  return cleaned.trim()
}

export function sanitizeUserInput(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item,
      )
    } else if (value !== null && typeof value === 'object') {
      result[key] = sanitizeUserInput(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

// ─────────────────────────────────────────────────────────────────
// JSON EXTRACTION (LLM output recovery)
// ─────────────────────────────────────────────────────────────────

/**
 * Attempts to repair and parse partially truncated or malformed JSON from LLMs.
 */
export function repairJSON(text: string): unknown | null {
  let cleaned = text.trim()
  
  // Basic recovery for unclosed braces/brackets
  const stack: string[] = []
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    if (char === '{')      stack.push('}')
    else if (char === '[') stack.push(']')
    else if (char === '}') stack.pop()
    else if (char === ']') stack.pop()
  }
  
  // Append missing closers in reverse order
  while (stack.length > 0) {
    cleaned += stack.pop()
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export function extractJSON(text: string): unknown | null {
  // Strategy 1: Direct parse
  try { return JSON.parse(text) } catch {/* continue */}

  // Strategy 2: Extract from markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) {
    const content = fenceMatch[1].trim()
    try { return JSON.parse(content) } catch {
      return repairJSON(content)
    }
  }

  // Strategy 3: Find first {...} block
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch?.[0]) {
    try { return JSON.parse(braceMatch[0]) } catch {
      return repairJSON(braceMatch[0])
    }
  }

  return repairJSON(text)
}

// ─────────────────────────────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────────────────────────────

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0]!
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

// ─────────────────────────────────────────────────────────────────
// SLEEP UTILITY
// ─────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────────────────────────────
// GENERATE TRACE ID
// ─────────────────────────────────────────────────────────────────

export function generateTraceId(): string {
  try {
    if (typeof window === 'undefined') {
      const crypto = require('crypto')
      if (crypto && typeof crypto.createHash === 'function') {
        return crypto.createHash('sha256')
          .update(`${Date.now()}-${Math.random()}`)
          .digest('hex')
          .slice(0, 16)
      }
    }
  } catch (err) {
    // Fallback below
  }

  // Browser-safe fallback
  return Math.random().toString(36).substring(2, 10) + 
         Math.random().toString(36).substring(2, 10)
}
