import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import { env }        from './config/env'
import { logger }     from './config/logger'
import { connectDB }  from './db/connection'
import {
  traceMiddleware,
  requestLogger,
  globalRateLimiter,
  errorHandler,
} from './middleware'
import { sanitizeBodyMiddleware } from './middleware/rbac.middleware'
import { metrics, registry }     from './utils/metrics'
import { MaintenanceService }    from './services/maintenance.service'

import recommendRoutes from './routes/recommend.routes'
import profileRoutes   from './routes/profile.routes'
import feedbackRoutes  from './routes/feedback.routes'
import weatherRoutes   from './routes/weather.routes'
import trendsRoutes    from './routes/trends.routes'
import wardrobeRoutes  from './routes/wardrobe.routes'

// ─────────────────────────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  await connectDB()

  // Initialize maintenance service
  const maintenanceService = new MaintenanceService()
  
  // Sync indexes on startup
  await maintenanceService.syncIndexes()
  
  // Schedule ongoing maintenance
  scheduleDailyMaintenance(maintenanceService)

  const app = express()

  // ── Security ──────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'none'"],
        objectSrc:  ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }))
  app.use(cors({
    origin:         env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials:    true,
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
    exposedHeaders: ['X-Trace-Id'],
  }))

  // ── Parsing ───────────────────────────────────────────────────
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: false, limit: '100kb' }))

  // ── Observability ─────────────────────────────────────────────
  app.use(traceMiddleware)
  app.use(requestLogger)

  // ── Input sanitization ───────────────────────────────────────
  app.use(sanitizeBodyMiddleware)

  // ── Rate limiting ─────────────────────────────────────────────
  app.use(globalRateLimiter)

  // ── Health & Info (unprotected) ─────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      message: 'AI Fashion Stylist API',
      version: '2.0.0',
      docs:    'https://github.com/shubh-bit/ai-fashion-stylist',
      health:  '/health',
    })
  })

  app.get('/health', async (_req, res) => {
    res.json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      version:   '2.0.0',
      uptime:    Math.floor(process.uptime()),
    })
  })

  // ── Prometheus metrics (admin-protected) ─────────────────────
  app.get('/metrics', async (req, res) => {
    const adminToken = req.headers['x-admin-token']
    if (env.NODE_ENV === 'production' && adminToken !== process.env['ADMIN_METRICS_TOKEN']) {
      res.status(403).end()
      return
    }
    try {
      res.setHeader('Content-Type', registry.contentType)
      res.end(await registry.metrics())
    } catch (err) {
      logger.error({ err }, 'Failed to collect metrics')
      res.status(500).end()
    }
  })

  // ── API Routes ────────────────────────────────────────────────
  app.use('/api/v1/recommend', recommendRoutes)
  app.use('/api/v1/profile',   profileRoutes)
  app.use('/api/v1/feedback',  feedbackRoutes)
  app.use('/api/v1/weather',   weatherRoutes)
  app.use('/api/v1/trends',    trendsRoutes)
  app.use('/api/v1/wardrobe',  wardrobeRoutes)

  // ── 404 handler ───────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404)
      .setHeader('Content-Type', 'application/problem+json')
      .json({
        type:     'https://api.ai-fashion.app/problems/not-found',
        title:    'Not Found',
        status:   404,
        detail:   `Route ${req.method} ${req.path} not found`,
        instance: `/trace/${req.traceId}`,
        traceId:  req.traceId,
      })
  })

  // ── Global error handler ──────────────────────────────────────
  app.use(errorHandler)

  // ── Start server ──────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV, version: '2.0.0' }, '🚀 API server started (Redis-free)')
  })

  // ── Graceful shutdown ─────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received — draining connections')
    server.close(async () => {
      const { disconnectDB } = await import('./db/connection')
      await disconnectDB()
      logger.info('Server closed cleanly')
      process.exit(0)
    })
    setTimeout(() => {
      logger.error('Graceful shutdown timeout — forcing exit')
      process.exit(1)
    }, 15_000)
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT',  () => void shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection')
  })
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down')
    void shutdown('uncaughtException')
  })
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function scheduleDailyMaintenance(maintenanceService: MaintenanceService): void {
  // Run maintenance every 6 hours
  const SIX_HOURS = 6 * 60 * 60 * 1000
  setInterval(() => {
    maintenanceService.runAllTasks().catch((err) => {
      logger.error({ err }, 'Scheduled maintenance failed')
    })
  }, SIX_HOURS)
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err)
  process.exit(1)
})
