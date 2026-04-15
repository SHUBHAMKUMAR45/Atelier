import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────
// DB SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const BodyMeasurementsSchema = z.object({
  height:        z.number().min(50).max(300),
  weight:        z.number().min(20).max(500),
  chest:         z.number().min(40).max(200).optional(),
  waist:         z.number().min(30).max(200).optional(),
  hips:          z.number().min(40).max(200).optional(),
  inseam:        z.number().min(20).max(120).optional(),
  shoulderWidth: z.number().min(20).max(80).optional(),
})

export const StyleEnum = z.enum([
  'casual', 'formal', 'streetwear', 'business',
  'athletic', 'bohemian', 'minimalist', 'vintage',
])

export const OccasionEnum = z.enum([
  'work', 'date', 'party', 'gym', 'travel',
  'wedding', 'casual', 'outdoor',
])

export const BudgetEnum = z.enum(['budget', 'mid', 'luxury'])

export const GenderEnum = z.enum([
  'male', 'female', 'non-binary', 'prefer-not-to-say',
])

export const UserPreferencesSchema = z.object({
  styles:       z.array(StyleEnum).min(1).max(5),
  colors:       z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10),
  avoidColors:  z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10),
  occasions:    z.array(OccasionEnum).min(1).max(8),
  budget:       BudgetEnum,
  gender:       GenderEnum,
  brands:       z.array(z.string().max(50)).max(20).optional(),
  avoidBrands:  z.array(z.string().max(50)).max(20).optional(),
})

export const LocationSchema = z.object({
  city:    z.string().max(100).min(1),
  country: z.string().length(2),
  lat:     z.number().min(-90).max(90),
  lon:     z.number().min(-180).max(180),
})

export const DailyQuotaSchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0).max(5),
})

export const UserProfileSchema = z.object({
  _id:          z.string(),
  clerkUserId:  z.string().min(1),
  email:        z.string().email(),
  displayName:  z.string().max(100),
  measurements: BodyMeasurementsSchema.optional(),
  preferences:  UserPreferencesSchema.optional(),
  location:     LocationSchema.optional(),
  dailyQuota:   DailyQuotaSchema,
  createdAt:    z.date(),
  updatedAt:    z.date(),
})

export const ClothingCategoryEnum = z.enum([
  'top', 'bottom', 'shoes', 'outerwear',
  'accessory', 'dress', 'suit',
])

export const ClothingItemSchema = z.object({
  category:    ClothingCategoryEnum,
  name:        z.string().max(200).min(1),
  description: z.string().max(500).min(1),
  color:       z.string().max(50).min(1),
  material:    z.string().max(100).optional(),
  style:       z.string().max(100).min(1),
  priceRange:  BudgetEnum,
  searchTerms: z.array(z.string().max(50)).min(1).max(5),
})

export const WardrobeItemSchema = z.object({
  _id:         z.string(),
  userId:      z.string().min(1),
  category:    ClothingCategoryEnum,
  name:        z.string().min(1).max(200),
  imageUrl:    z.string().url(),
  color:       z.string().max(50).optional(),
  brand:       z.string().max(50).optional(),
  lastWorn:    z.string().optional(),
  createdAt:   z.date(),
  updatedAt:   z.date(),
})

export const WeatherContextSchema = z.object({
  temp:      z.number().min(-60).max(60),
  condition: z.string().max(100),
  humidity:  z.number().min(0).max(100),
  windSpeed: z.number().min(0).max(300),
})

export const OutfitSchema = z.object({
  title:           z.string().max(200).min(1),
  description:     z.string().max(1000).min(1),
  items:           z.array(ClothingItemSchema).min(2).max(8),
  stylingTips:     z.array(z.string().max(300)).max(5),
  colorPalette:    z.array(z.string()).max(6),
  confidenceScore: z.number().min(0).max(1),
})

export const ImageStatusEnum = z.enum([
  'pending', 'generating', 'ready', 'failed',
])

export const AIProviderEnum = z.enum(['gemini', 'openai', 'cached'])

export const OutfitRecommendationSchema = z.object({
  _id:            z.string(),
  userId:         z.string().min(1),
  requestHash:    z.string().min(1),
  occasion:       z.string().max(100).min(1),
  weatherContext: WeatherContextSchema,
  outfit:         OutfitSchema,
  imageUrl:       z.string().url().optional(),
  imageStatus:    ImageStatusEnum,
  aiProvider:     AIProviderEnum,
  cacheHit:       z.boolean(),
  feedback: z.object({
    rating:  z.enum(['like', 'dislike']).optional(),
    savedAt: z.date().optional(),
  }),
  expiresAt:  z.date(),
  createdAt:  z.date(),
})

export const AICacheEntrySchema = z.object({
  _id:          z.string(),
  cacheKey:     z.string().min(1),
  requestType:  z.enum(['outfit', 'trend', 'image', 'weather']),
  response:     z.unknown(),
  ttlExpiresAt: z.date(),
  hitCount:     z.number().int().min(0),
  createdAt:    z.date(),
})

export const FeedbackSchema = z.object({
  _id:              z.string(),
  userId:           z.string().min(1),
  recommendationId: z.string().min(1),
  rating:           z.enum(['like', 'dislike']),
  reason:           z.string().max(500).optional(),
  createdAt:        z.date(),
})

// ─────────────────────────────────────────────────────────────────
// API REQUEST SCHEMAS
// ─────────────────────────────────────────────────────────────────

export const SetupProfileRequestSchema = z.object({
  displayName:  z.string().min(1).max(100),
  email:        z.string().email(),
  measurements: BodyMeasurementsSchema.optional(),
  preferences:  UserPreferencesSchema.optional(),
  location:     LocationSchema.optional(),
})

export const UpdateMeasurementsRequestSchema = BodyMeasurementsSchema

export const UpdatePreferencesRequestSchema = UserPreferencesSchema

export const RecommendRequestSchema = z.object({
  occasion:    OccasionEnum,
  description: z.string().max(500).optional(),
  useWardrobe: z.boolean().optional().default(false),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }).optional(),
})

export const FeedbackRequestSchema = z.object({
  rating: z.enum(['like', 'dislike']),
  reason: z.string().max(500).optional(),
})

export const CreateWardrobeItemRequestSchema = z.object({
  category: ClothingCategoryEnum,
  name:     z.string().min(1).max(200),
  imageUrl: z.string().url(),
  color:    z.string().max(50).optional(),
  brand:    z.string().max(50).optional(),
})

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

// ─────────────────────────────────────────────────────────────────
// AI OUTPUT CONTRACT SCHEMAS (what LLM must return)
// ─────────────────────────────────────────────────────────────────

export const AIOutfitOutputSchema = z.object({
  title:           z.string().min(1).max(200),
  description:     z.string().min(1).max(1000),
  items: z.array(z.object({
    category:    ClothingCategoryEnum,
    name:        z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    color:       z.string().min(1).max(50),
    material:    z.string().max(100).optional(),
    style:       z.string().min(1).max(100),
    priceRange:  BudgetEnum,
    searchTerms: z.array(z.string().max(50)).min(1).max(5),
  })).min(2).max(8),
  stylingTips:     z.array(z.string().max(300)).min(1).max(5),
  colorPalette:    z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(2).max(6),
  confidenceScore: z.number().min(0).max(1),
})

export const AITrendOutputSchema = z.object({
  trends: z.array(z.object({
    trend:       z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    relevance:   z.number().min(0).max(1),
  })).min(1).max(10),
  location:  z.string(),
  season:    z.string(),
  updatedAt: z.string(),
})

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type UserProfile          = z.infer<typeof UserProfileSchema>
export type BodyMeasurements     = z.infer<typeof BodyMeasurementsSchema>
export type UserPreferences      = z.infer<typeof UserPreferencesSchema>
export type OutfitRecommendation = z.infer<typeof OutfitRecommendationSchema>
export type AICacheEntry         = z.infer<typeof AICacheEntrySchema>
export type Feedback             = z.infer<typeof FeedbackSchema>
export type WeatherContext       = z.infer<typeof WeatherContextSchema>
export type Outfit               = z.infer<typeof OutfitSchema>
export type ClothingItem         = z.infer<typeof ClothingItemSchema>
export type AIOutfitOutput       = z.infer<typeof AIOutfitOutputSchema>
export type AITrendOutput        = z.infer<typeof AITrendOutputSchema>
export type RecommendRequest     = z.infer<typeof RecommendRequestSchema>
export type SetupProfileRequest  = z.infer<typeof SetupProfileRequestSchema>
export type FeedbackRequest      = z.infer<typeof FeedbackRequestSchema>
export type WardrobeItem         = z.infer<typeof WardrobeItemSchema>
export type CreateWardrobeItemRequest = z.infer<typeof CreateWardrobeItemRequestSchema>
