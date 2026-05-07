import xss from 'xss'
import { metrics } from './metrics'

// ─────────────────────────────────────────────────────────────────
// XSS CONFIG — strip all HTML tags
// ─────────────────────────────────────────────────────────────────

const xssOptions = {
  whiteList:   {} as Record<string, string[]>,  // No tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
}

// ─────────────────────────────────────────────────────────────────
// PROMPT INJECTION PATTERNS
// ─────────────────────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /system\s*:\s*/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /forget\s+everything/i,
  /disregard\s+/i,
  /\[INST\]|\[\/INST\]/,
  /<\|im_start\|>|<\|im_end\|>/,
  /###\s*(system|human|assistant)/i,
  /```(system|python|javascript|bash|sh)/i,
]

// ─────────────────────────────────────────────────────────────────
// MONGO OPERATOR INJECTION PATTERNS
// ─────────────────────────────────────────────────────────────────

const MONGO_INJECTION_PATTERN = /\$[a-zA-Z]+/

// ─────────────────────────────────────────────────────────────────
// SQL INJECTION KEYWORDS (for any raw string usage)
// ─────────────────────────────────────────────────────────────────

const SQL_INJECTION_PATTERN = /(\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bUNION\b|'--|;\s*--)/i

// ─────────────────────────────────────────────────────────────────
// MAIN SANITIZE FUNCTION
// ─────────────────────────────────────────────────────────────────

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return String(input)

  // 1. Strip XSS
  let sanitized = xss(input, xssOptions)

  // 2. Normalize whitespace (collapse multiple spaces/newlines)
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  // 3. Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // 4. Remove prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      metrics.securityRejections.inc({ reason: 'prompt-injection' })
      // Strip the injection attempt rather than blocking (graceful degradation)
      sanitized = sanitized.replace(pattern, '[removed]')
    }
  }

  // 5. Remove MongoDB operators
  if (MONGO_INJECTION_PATTERN.test(sanitized)) {
    metrics.securityRejections.inc({ reason: 'mongo-injection' })
    sanitized = sanitized.replace(/\$[a-zA-Z]+/g, '')
  }

  return sanitized
}

// ─────────────────────────────────────────────────────────────────
// STRICT VALIDATE — throws if dangerous content detected
// ─────────────────────────────────────────────────────────────────

export function validateInputStrict(input: string, fieldName = 'input'): string {
  const sanitized = sanitizeInput(input)

  // Detect SQL injection
  if (SQL_INJECTION_PATTERN.test(sanitized)) {
    metrics.securityRejections.inc({ reason: 'sql-injection-attempt' })
    throw new SecurityValidationError(`Invalid characters in ${fieldName}`)
  }

  return sanitized
}

// ─────────────────────────────────────────────────────────────────
// AI PROMPT SANITIZER (extra strict for user-supplied AI prompts)
// ─────────────────────────────────────────────────────────────────

export function sanitizeForAIPrompt(input: string): string {
  let sanitized = sanitizeInput(input)

  // Hard-limit length to prevent context window stuffing
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500)
    metrics.securityRejections.inc({ reason: 'prompt-truncated' })
  }

  // Remove any remaining angle brackets (HTML/XML/injection)
  sanitized = sanitized.replace(/[<>]/g, '')

  // Remove backticks (code injection in some models)
  sanitized = sanitized.replace(/`/g, "'")

  return sanitized
}

// ─────────────────────────────────────────────────────────────────
// OBJECT SANITIZER (for req.body deep sanitization)
// ─────────────────────────────────────────────────────────────────

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        typeof v === 'string'
          ? sanitizeInput(v)
          : typeof v === 'object' && v !== null
            ? sanitizeObject(v as Record<string, unknown>)
            : v,
      )
    } else {
      result[key] = value
    }
  }
  return result as T
}

// ─────────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────────

export class SecurityValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = 'SecurityValidationError'
  }
}
