import mongoose, { Connection } from 'mongoose'
import { env }    from '../config/env'
import { logger } from '../config/logger'

let connection: Connection | null = null

export async function connectDB(): Promise<Connection> {
  if (connection?.readyState === 1) return connection

  const RETRY_ATTEMPTS = 5
  const RETRY_DELAY_MS = 3_000

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        dbName:             env.MONGODB_DB_NAME,
        maxPoolSize:        10,
        serverSelectionTimeoutMS: 5_000,
        socketTimeoutMS:    45_000,
        connectTimeoutMS:   10_000,
      })

      connection = mongoose.connection

      connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected — attempting reconnect')
      })

      connection.on('error', (err) => {
        logger.error({ err }, 'MongoDB connection error')
      })

      logger.info({ attempt }, 'MongoDB connected successfully')
      await ensureIndexes()
      return connection
    } catch (err) {
      logger.error({ err, attempt }, `MongoDB connection attempt ${attempt} failed`)
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
      }
    }
  }

  throw new Error(`MongoDB failed to connect after ${RETRY_ATTEMPTS} attempts`)
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
  connection = null
  logger.info('MongoDB disconnected')
}

async function ensureIndexes(): Promise<void> {
  const db = mongoose.connection.db
  if (!db) return

  const ops: Array<{ collection: string; keys: Record<string, 1 | -1 | 'text'>; options?: Record<string, unknown> }> = [
    // Users
    { collection: 'users', keys: { clerkUserId: 1 }, options: { unique: true } },
    { collection: 'users', keys: { 'location.city': 1 } },

    // Recommendations
    { collection: 'recommendations', keys: { userId: 1, createdAt: -1 } },
    { collection: 'recommendations', keys: { requestHash: 1 }, options: { unique: true } },
    { collection: 'recommendations', keys: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },

    // AI Cache
    { collection: 'ai_cache', keys: { cacheKey: 1 }, options: { unique: true } },
    { collection: 'ai_cache', keys: { ttlExpiresAt: 1 }, options: { expireAfterSeconds: 0 } },

    // Feedback
    { collection: 'feedback', keys: { userId: 1, recommendationId: 1 } },
    { collection: 'feedback', keys: { userId: 1, createdAt: -1 } },

    // Wardrobe — prevent collection scans on every wardrobe fetch
    { collection: 'wardrobe', keys: { userId: 1 } },
    { collection: 'wardrobe', keys: { userId: 1, category: 1 } },
  ]

  await Promise.allSettled(
    ops.map(async ({ collection, keys, options }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.collection(collection).createIndex(keys as any, {
          background: true,
          ...options,
        })
      } catch (err: unknown) {
        // Index may already exist — only warn on unexpected errors
        if ((err as { code?: number }).code !== 85 && (err as { code?: number }).code !== 86) {
          logger.warn({ err, collection }, 'Index creation warning')
        }
      }
    }),
  )

  logger.info('MongoDB indexes ensured')
}

export function getDB() {
  if (!connection || connection.readyState !== 1) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return connection
}
