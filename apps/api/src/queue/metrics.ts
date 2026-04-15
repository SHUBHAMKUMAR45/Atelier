import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client'

// ─────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────

export const registry = new Registry()
collectDefaultMetrics({ register: registry, prefix: 'ai_fashion_' })

// ─────────────────────────────────────────────────────────────────
// HTTP METRICS
// ─────────────────────────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name:    'ai_fashion_http_request_duration_seconds',
  help:    'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
})

export const httpRequestTotal = new Counter({
  name:    'ai_fashion_http_requests_total',
  help:    'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
})

// ─────────────────────────────────────────────────────────────────
// AI PROVIDER METRICS
// ─────────────────────────────────────────────────────────────────

export const aiRequestDuration = new Histogram({
  name:    'ai_fashion_ai_request_duration_seconds',
  help:    'AI provider request latency',
  labelNames: ['provider', 'operation'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
  registers: [registry],
})

export const aiRequestTotal = new Counter({
  name:    'ai_fashion_ai_requests_total',
  help:    'Total AI provider requests',
  labelNames: ['provider', 'operation', 'status'],
  registers: [registry],
})

export const aiCacheHitTotal = new Counter({
  name:    'ai_fashion_ai_cache_hits_total',
  help:    'AI cache hit/miss counts',
  labelNames: ['type', 'result'],
  registers: [registry],
})

export const aiHallucinationRejections = new Counter({
  name:    'ai_fashion_hallucination_rejections_total',
  help:    'AI outputs rejected by anti-hallucination validation',
  labelNames: ['provider', 'reason'],
  registers: [registry],
})

export const circuitBreakerState = new Gauge({
  name:    'ai_fashion_circuit_breaker_state',
  help:    'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['provider'],
  registers: [registry],
})

// ─────────────────────────────────────────────────────────────────
// QUEUE METRICS
// ─────────────────────────────────────────────────────────────────

export const queueJobEnqueued = new Counter({
  name:    'ai_fashion_queue_jobs_enqueued_total',
  help:    'Total jobs enqueued per queue',
  labelNames: ['queue'],
  registers: [registry],
})

export const queueJobCompleted = new Counter({
  name:    'ai_fashion_queue_jobs_completed_total',
  help:    'Total jobs completed/failed per queue',
  labelNames: ['queue', 'status'],
  registers: [registry],
})

export const queueJobDuration = new Histogram({
  name:    'ai_fashion_queue_job_duration_seconds',
  help:    'Queue job processing duration',
  labelNames: ['queue', 'job_name'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [registry],
})

export const queueDepth = new Gauge({
  name:    'ai_fashion_queue_depth',
  help:    'Current queue depth (waiting jobs)',
  labelNames: ['queue'],
  registers: [registry],
})

// ─────────────────────────────────────────────────────────────────
// BUSINESS METRICS
// ─────────────────────────────────────────────────────────────────

export const recommendationsGenerated = new Counter({
  name:    'ai_fashion_recommendations_generated_total',
  help:    'Total outfit recommendations generated',
  labelNames: ['provider', 'cache_hit', 'occasion'],
  registers: [registry],
})

export const quotaExceeded = new Counter({
  name:    'ai_fashion_quota_exceeded_total',
  help:    'Daily quota exceeded events',
  registers: [registry],
})

export const activeUsers = new Gauge({
  name:    'ai_fashion_active_users',
  help:    'Approximate active users (last 5 min)',
  registers: [registry],
})

// ─────────────────────────────────────────────────────────────────
// SECURITY METRICS
// ─────────────────────────────────────────────────────────────────

export const securityRejections = new Counter({
  name:    'ai_fashion_security_rejections_total',
  help:    'Requests rejected by security middleware',
  labelNames: ['reason'],
  registers: [registry],
})

export const authFailures = new Counter({
  name:    'ai_fashion_auth_failures_total',
  help:    'Authentication failures',
  labelNames: ['reason'],
  registers: [registry],
})

// ─────────────────────────────────────────────────────────────────
// AGGREGATED EXPORT
// ─────────────────────────────────────────────────────────────────

export const metrics = {
  httpRequestDuration,
  httpRequestTotal,
  aiRequestDuration,
  aiRequestTotal,
  aiCacheHitTotal,
  aiHallucinationRejections,
  circuitBreakerState,
  queueJobEnqueued,
  queueJobCompleted,
  queueJobDuration,
  queueDepth,
  recommendationsGenerated,
  quotaExceeded,
  activeUsers,
  securityRejections,
  authFailures,
  registry,
}
