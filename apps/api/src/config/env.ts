import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV:  z.enum(['development', 'test', 'production']).default('development'),
  PORT:      z.coerce.number().int().min(1024).max(65535).default(4000),

  MONGODB_URI:      z.string().min(1),
  MONGODB_DB_NAME:  z.string().min(1).default('ai-fashion-stylist'),


  CLERK_SECRET_KEY:     z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  GEMINI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),

  REPLICATE_API_TOKEN:   z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY:    z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  WEATHER_API_KEY: z.string().min(1),

  DAILY_QUOTA_LIMIT:     z.coerce.number().int().min(1).default(5),
  GLOBAL_RATE_LIMIT_RPM: z.coerce.number().int().min(1).default(100),

  GEMINI_MODEL:  z.string().default('gemini-1.5-flash'),
  OPENAI_MODEL:  z.string().default('gpt-4o-mini'),

  CACHE_TTL_TEXT_HOURS:   z.coerce.number().default(6),
  CACHE_TTL_TREND_HOURS:  z.coerce.number().default(24),
  CACHE_TTL_WEATHER_MINS: z.coerce.number().default(30),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:4000,http://localhost:8081'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  ADMIN_METRICS_TOKEN: z.string().optional(),
})

function loadEnv() {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    if (process.env['NODE_ENV'] === 'test') {
      console.warn('⚠️  Missing environment variables in test environment. Using dummy values.')
      return EnvSchema.parse({
        MONGODB_URI: 'mongodb://localhost:27017/test',
        CLERK_SECRET_KEY: 'test',
        CLERK_WEBHOOK_SECRET: 'test',
        GEMINI_API_KEY: 'test',
        OPENAI_API_KEY: 'test',
        REPLICATE_API_TOKEN: 'test',
        CLOUDINARY_CLOUD_NAME: 'test',
        CLOUDINARY_API_KEY: 'test',
        CLOUDINARY_API_SECRET: 'test',
        WEATHER_API_KEY: 'test',
        ...process.env,
      })
    }
    const missing = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    console.error('❌ Invalid environment variables:')
    missing.forEach((m) => console.error(`  - ${m}`))
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()

// ── Runtime warnings ───────────────────────────────────────────────
if (env.NODE_ENV === 'production' && env.MONGODB_URI.includes('localhost')) {
  console.error('❌ MONGODB_URI points to localhost in production. Use MongoDB Atlas.')
  process.exit(1)
}
if (env.NODE_ENV !== 'test' && env.MONGODB_URI.includes('localhost')) {
  console.warn('⚠️  MONGODB_URI uses localhost. Set a real MongoDB Atlas URI for persistent data.')
  console.warn('   Free cluster: https://cloud.mongodb.com')
}
export type Env = z.infer<typeof EnvSchema>
