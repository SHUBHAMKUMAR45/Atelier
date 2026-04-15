import pino from 'pino'
import { env } from '../config/env'

export const logger = pino({
  level: env.LOG_LEVEL,
  base:  { service: 'ai-fashion-api', env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target:  'pino-pretty',
      options: { colorize: true, singleLine: false },
    },
  }),
})

// Typed child logger factory
export function createRequestLogger(traceId: string, userId?: string) {
  return logger.child({ traceId, userId: userId ?? 'anonymous' })
}

export type Logger = typeof logger

/**
 * Creates a child logger with a module label.
 */
export function createLogger(module: string) {
  return logger.child({ module })
}
