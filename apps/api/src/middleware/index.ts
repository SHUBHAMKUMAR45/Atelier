import type { Request, Response, NextFunction } from 'express'
import rateLimit  from 'express-rate-limit'
import { ZodError, type ZodSchema } from 'zod'
import { generateTraceId } from '../../../../packages/shared/src/utils'
import { logger }          from '../config/logger'
import { env }             from '../config/env'
import { metrics }         from '../utils/metrics'

export function problemDetails(
  status: number, detail: string, traceId: string, _extra?: any,
): Record<string, unknown> {
  return {
    success: false,
    data:    null,
    error:   detail,
    traceId,
  }
}

export function successResponse<T>(data: T, traceId: string) {
  return { 
    success: true, 
    data, 
    error: null, 
    traceId 
  }
}

export function paginatedResponse<T>(items: T[], total: number, page: number, limit: number, traceId: string) {
  // data must be PaginatedData<T> so AtelierClient.request() extracts it correctly
  return { 
    success: true, 
    data: {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    }, 
    error: null, 
    traceId,
  }
}

export function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.traceId = (req.headers['x-trace-id'] as string | undefined) ?? generateTraceId()
  res.setHeader('X-Trace-Id', req.traceId)
  next()
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startNs = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000
    const route      = req.route?.path ?? req.path
    const status     = String(res.statusCode)
    // Add X-Response-Time for client-side and APM visibility
    res.setHeader('X-Response-Time', `${Math.round(durationMs)}ms`)
    metrics.httpRequestDuration.observe({ method: req.method, route, status_code: status }, durationMs / 1000)
    metrics.httpRequestTotal.inc({ method: req.method, route, status_code: status })
    logger.info({
      traceId:    req.traceId,
      userId:     req.userId ?? 'anonymous',
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      durationMs: Math.round(durationMs),
      ip:         req.ip,
    }, 'request completed')
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
    
    res.status(400).json({
      success: false,
      data:    null,
      error:   'Validation failed',
      errors:  err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      traceId,
    })
    return
  }

  // Handle standardized API errors (from shared or domain)
  if (err instanceof Error) {
    const status = (err as any).status || (err as any).statusCode || 500
    
    if (status >= 500) {
      logger.error({ traceId, err, userId: req.userId }, 'Unhandled server error')
    } else {
      logger.warn({ traceId, status, message: err.message }, 'Client-facing domain error')
    }

    res.status(status).json(problemDetails(
      status, 
      status >= 500 && env.NODE_ENV === 'production' ? 'Internal server error' : err.message, 
      traceId
    ))
    return
  }

  // Fallback for non-error throws
  logger.error({ traceId, err, userId: req.userId }, 'Unknown throw detected')
  res.status(500).json(problemDetails(500, 'Internal server error', traceId))
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        success: false,
        data:    null,
        error:   'Invalid request body',
        errors:  result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        traceId: req.traceId,
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
      res.status(400).json({
        success: false,
        data:    null,
        error:   'Invalid query parameters',
        errors:  result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        traceId: req.traceId,
      })
      return
    }
    Object.assign(req.query, result.data)
    next()
  }
}
