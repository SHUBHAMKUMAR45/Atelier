import type { Request, Response, NextFunction } from 'express'
import rateLimit  from 'express-rate-limit'
import { ZodError, type ZodSchema } from 'zod'
import { generateTraceId } from '../../../../packages/shared/src/utils'
import { logger }          from '../config/logger'
import { env }             from '../config/env'
import { metrics }         from '../utils/metrics'

// RFC 7807 PROBLEM DETAILS
const BASE_URI = 'https://api.ai-fashion.app/problems'

export interface ProblemDetails {
  type: string; title: string; status: number; detail: string
  instance?: string; traceId?: string
  errors?: Array<{ field: string; message: string }>
}

export function problemDetails(
  status: number, detail: string, traceId: string, extra?: Partial<ProblemDetails>,
): ProblemDetails {
  const titleMap: Record<number, string> = {
    400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',
    409:'Conflict',422:'Unprocessable Entity',429:'Too Many Requests',
    500:'Internal Server Error',503:'Service Unavailable',
  }
  const typeMap: Record<number, string> = {
    400:`${BASE_URI}/bad-request`,401:`${BASE_URI}/unauthorized`,
    403:`${BASE_URI}/forbidden`,404:`${BASE_URI}/not-found`,
    409:`${BASE_URI}/conflict`,422:`${BASE_URI}/unprocessable-entity`,
    429:`${BASE_URI}/rate-limited`,500:`${BASE_URI}/internal-error`,
    503:`${BASE_URI}/service-unavailable`,
  }
  return {
    type: typeMap[status] ?? `${BASE_URI}/error`,
    title: titleMap[status] ?? 'Error',
    status, detail, instance: `/trace/${traceId}`, traceId, ...extra,
  }
}

export function successResponse<T>(data: T, traceId: string, meta?: Record<string, unknown>) {
  return { success: true, data, traceId, ...(meta ? { meta } : {}) }
}

export function paginatedResponse<T>(items: T[], total: number, page: number, limit: number, traceId: string) {
  return { success: true, data: items, traceId, meta: { page, limit, total, pages: Math.ceil(total / limit) } }
}

export function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.traceId = (req.headers['x-trace-id'] as string | undefined) ?? generateTraceId()
  res.setHeader('X-Trace-Id', req.traceId)
  next()
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path ?? req.path
    const status = String(res.statusCode)
    metrics.httpRequestDuration.observe({ method: req.method, route, status_code: status }, duration)
    metrics.httpRequestTotal.inc({ method: req.method, route, status_code: status })
    logger.info({ traceId: req.traceId, userId: req.userId ?? 'anonymous', method: req.method,
      path: req.path, status: res.statusCode, latencyMs: Date.now() - start, ip: req.ip }, 'request completed')
  })
  next()
}

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1_000, max: env.GLOBAL_RATE_LIMIT_RPM,
  keyGenerator: (req) => req.ip ?? 'unknown',
  standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => {
    metrics.securityRejections.inc({ reason: 'rate-limit-global' })
    logger.warn({ traceId: req.traceId, ip: req.ip }, 'Global rate limit exceeded')
    res.status(429).json(problemDetails(429, 'Too many requests. Please try again in a minute.', req.traceId))
  },
})

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1_000, max: 10,
  keyGenerator: (req) => req.userId ?? req.ip ?? 'unknown',
  standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => {
    metrics.securityRejections.inc({ reason: 'rate-limit-ai' })
    res.status(429).json(problemDetails(429, 'AI request rate limit exceeded. Please wait before trying again.', req.traceId))
  },
})

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const traceId = req.traceId ?? 'unknown'
  if (err instanceof ZodError) {
    metrics.securityRejections.inc({ reason: 'validation-error' })
    logger.warn({ traceId, errors: err.errors }, 'Validation error')
    res.status(400).setHeader('Content-Type', 'application/problem+json').json({
      ...problemDetails(400, 'Validation failed', traceId),
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }
  if (err instanceof Error && 'statusCode' in err) {
    const statusCode = (err as Error & { statusCode: number }).statusCode
    res.status(statusCode).setHeader('Content-Type', 'application/problem+json')
      .json(problemDetails(statusCode, err.message, traceId))
    return
  }
  const message = err instanceof Error ? err.message : 'Internal server error'
  logger.error({ traceId, err, userId: req.userId }, 'Unhandled error')
  res.status(500).setHeader('Content-Type', 'application/problem+json').json({
    ...problemDetails(500, 'Something went wrong. Please try again.', traceId),
    ...(env.NODE_ENV !== 'production' && { debug: message }),
  })
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).setHeader('Content-Type', 'application/problem+json').json({
        ...problemDetails(400, 'Invalid request body', req.traceId),
        errors: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).setHeader('Content-Type', 'application/problem+json').json({
        ...problemDetails(400, 'Invalid query parameters', req.traceId),
        errors: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      })
      return
    }
    Object.assign(req.query, result.data)
    next()
  }
}
