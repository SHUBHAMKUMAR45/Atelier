import type { Request, Response, NextFunction } from 'express'
import { verifyToken }   from '@clerk/backend'
import { env }           from '../config/env'
import { logger }        from '../config/logger'
import { metrics }       from '../utils/metrics'
import { sanitizeInput } from '../utils/sanitize'
import { todayDateString } from '../../../../packages/shared/src/utils'
import { UserProfileModel } from '../db/models'
import { problemDetails }    from './index'

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

// Augmentations moved to src/types/express.d.ts

// ─────────────────────────────────────────────────────────────────
// AUTH + RBAC MIDDLEWARE
// ─────────────────────────────────────────────────────────────────

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // ── Testing Bypass ───────────────────────────────────────────
  if (env.NODE_ENV !== 'production' && process.env['BYPASS_AUTH'] === 'true') {
    req.userId      = (req.headers['x-test-user-id'] as string) || 'test_user_smoke'
    req.role        = 'user'
    req.permissions = ROLE_PERMISSIONS['user']

    // Fire-and-forget: never blocks the request
    if (process.env['SKIP_DB'] !== 'true') {
      UserProfileModel.findOneAndUpdate(
        { clerkUserId: req.userId },
        {
          $setOnInsert: {
            clerkUserId:  req.userId,
            email:        'smoke-test@ai-fashion.app',
            displayName:  'Smoke Tester',
            dailyQuota:   { date: todayDateString(), count: 0 },
          },
        },
        { upsert: true, new: true },
      ).lean().catch((e: unknown) => {
        logger.warn({ e }, 'Bypass lazy sync failed (non-fatal)')
      })
    }

    next()
    return
  }

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    metrics.authFailures.inc({ reason: 'missing-header' })
    res.status(401).json(problemDetails(
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
      res.status(401).json(problemDetails(
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

    // ── Lazy Sync with MongoDB (FIRE-AND-FORGET) ─────────────────
    // Ensures a local DB record exists for this Clerk user.
    // Does NOT block the request — errors are logged but never surface to client.
    // todayDateString() used for consistent date format with the quota system.
    if (process.env['SKIP_DB'] !== 'true') {
      const email = (payload['email'] as string) ||
                    (payload['primary_email_address'] as string) ||
                    (payload['email_address'] as string) ||
                    'no-email@clerk.user'

      const name  = (payload['name'] as string) ||
                    (payload['full_name'] as string) ||
                    (payload['given_name'] as string) ||
                    'Fashion Enthusiast'

      // Deliberately NOT awaited — fire-and-forget
      UserProfileModel.findOneAndUpdate(
        { clerkUserId: payload.sub },
        {
          $setOnInsert: {
            clerkUserId:  payload.sub,
            email,
            displayName:  name,
            dailyQuota:   { date: todayDateString(), count: 0 },
          },
        },
        { upsert: true, new: true },
      ).lean().then(() => {
        logger.debug({ userId: payload.sub, email }, 'Lazy Sync OK')
      }).catch((syncErr: unknown) => {
        logger.error({ syncErr, userId: payload.sub }, 'Lazy Sync failed (non-fatal)')
      })
    }

    logger.debug({ traceId: req.traceId, userId: req.userId, role }, 'Auth verified')
    next()
  } catch (err) {
    metrics.authFailures.inc({ reason: 'invalid-token' })
    logger.warn({ err, traceId: req.traceId }, 'Auth verification failed')
    res.status(401).json(problemDetails(
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
      res.status(403).json(problemDetails(
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
