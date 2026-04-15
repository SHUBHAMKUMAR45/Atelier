import type { Request, Response, NextFunction } from 'express'
import { verifyToken }   from '@clerk/backend'
import { env }           from '../config/env'
import { logger }        from '../config/logger'
import { metrics }       from '../utils/metrics'
import { sanitizeInput } from '../utils/sanitize'
import { UserProfileModel } from '../db/models'

// ─────────────────────────────────────────────────────────────────
// RBAC ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type Role = 'user' | 'admin' | 'moderator'

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  user:      ['read:own', 'write:own', 'recommend:generate'],
  moderator: ['read:own', 'write:own', 'recommend:generate', 'read:all'],
  admin:     ['read:own', 'write:own', 'recommend:generate', 'read:all', 'write:all', 'admin:metrics'],
}

// ─────────────────────────────────────────────────────────────────
// AUGMENT EXPRESS REQUEST
// ─────────────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      userId:  string
      traceId: string
      role:    Role
      permissions: string[]
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// AUTH + RBAC MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    metrics.authFailures.inc({ reason: 'missing-header' })
    res.status(401).json(rfc7807(
      'https://api.ai-fashion.app/errors/unauthorized',
      'Unauthorized',
      401,
      'Missing or malformed Authorization header',
      req.traceId,
    ))
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY })

    if (!payload.sub) {
      metrics.authFailures.inc({ reason: 'missing-subject' })
      res.status(401).json(rfc7807(
        'https://api.ai-fashion.app/errors/unauthorized',
        'Unauthorized',
        401,
        'Invalid token: missing subject',
        req.traceId,
      ))
      return
    }

    // Extract role from Clerk metadata (publicMetadata.role)
    const rawRole = (payload['public_metadata'] as Record<string, unknown> | undefined)?.['role']
    const role: Role = isValidRole(rawRole) ? rawRole : 'user'

    req.userId      = payload.sub
    req.role        = role
    req.permissions = ROLE_PERMISSIONS[role]

    // ── Lazy Sync with MongoDB ───────────────────────────────
    // Ensures a local DB record exists for this Clerk user.
    // This fixes persistence issues for new users.
    try {
      const email = (payload['email'] as string) || (payload['primary_email_address'] as string) || 'no-email@clerk.user'
      const name  = (payload['name'] as string) || (payload['full_name'] as string) || 'Fashion Enthusiast'

      await UserProfileModel.findOneAndUpdate(
        { clerkUserId: payload.sub },
        { 
          $setOnInsert: { 
            clerkUserId: payload.sub,
            email: email,
            displayName: name,
            dailyQuota: { date: new Date().toISOString().split('T')[0], count: 0 }
          }
        },
        { upsert: true, new: true }
      ).lean()
    } catch (syncErr) {
      logger.error({ syncErr, userId: payload.sub }, 'Failed to sync user with MongoDB')
      // We don't block the request if sync fails, but we log it.
      // Most routes will hit 404 later if the record is truly missing.
    }

    logger.debug({ traceId: req.traceId, userId: req.userId, role }, 'Auth verified and synced')
    next()
  } catch (err) {
    metrics.authFailures.inc({ reason: 'invalid-token' })
    logger.warn({ err, traceId: req.traceId }, 'Auth verification failed')
    res.status(401).json(rfc7807(
      'https://api.ai-fashion.app/errors/unauthorized',
      'Unauthorized',
      401,
      'Invalid or expired token',
      req.traceId,
    ))
  }
}

// ─────────────────────────────────────────────────────────────────
// PERMISSION GUARD FACTORY
// ─────────────────────────────────────────────────────────────────

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.permissions?.includes(permission)) {
      metrics.securityRejections.inc({ reason: 'insufficient-permissions' })
      logger.warn({
        traceId:    req.traceId,
        userId:     req.userId,
        role:       req.role,
        permission,
      }, 'Permission denied')
      res.status(403).json(rfc7807(
        'https://api.ai-fashion.app/errors/forbidden',
        'Forbidden',
        403,
        `Permission '${permission}' required`,
        req.traceId,
      ))
      return
    }
    next()
  }
}

// ─────────────────────────────────────────────────────────────────
// INPUT SANITIZATION MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

export function sanitizeBodyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body)
  }
  next()
}

function deepSanitize(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize)
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Block prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      sanitized[sanitizeInput(key)] = deepSanitize(value)
    }
    return sanitized
  }
  return obj
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function isValidRole(role: unknown): role is Role {
  return role === 'user' || role === 'admin' || role === 'moderator'
}

// RFC 7807 Problem Details factory
export function rfc7807(
  type:     string,
  title:    string,
  status:   number,
  detail:   string,
  traceId?: string,
): Record<string, unknown> {
  return {
    type,
    title,
    status,
    detail,
    instance: traceId ? `/trace/${traceId}` : undefined,
    traceId,
  }
}
