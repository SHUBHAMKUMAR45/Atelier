/**
 * Jest globalSetup — runs once before all integration tests.
 * Sets minimum env vars so env.ts validation passes without real services.
 */
export default async function globalSetup() {
  process.env['NODE_ENV']              = 'test'
  process.env['PORT']                  = '4001'
  process.env['MONGODB_URI']           = 'mongodb://localhost:27017/test'
  process.env['MONGODB_DB_NAME']       = 'ai-fashion-test'
  process.env['CLERK_SECRET_KEY']      = 'sk_test_placeholder_for_integration_tests'
  process.env['CLERK_WEBHOOK_SECRET']  = 'whsec_test_placeholder'
  process.env['GEMINI_API_KEY']        = 'test-gemini-key'
  process.env['OPENAI_API_KEY']        = 'sk-test-openai-key'
  process.env['REPLICATE_API_TOKEN']   = 'r8_test'
  process.env['CLOUDINARY_CLOUD_NAME'] = 'test-cloud'
  process.env['CLOUDINARY_API_KEY']    = '123456789'
  process.env['CLOUDINARY_API_SECRET'] = 'test-secret'
  process.env['WEATHER_API_KEY']       = 'test-weather-key'
  process.env['ALLOWED_ORIGINS']       = 'http://localhost:3000'
}
