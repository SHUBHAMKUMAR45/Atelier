"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITrendOutputSchema = exports.AIOutfitOutputSchema = exports.PaginationSchema = exports.FeedbackRequestSchema = exports.RecommendRequestSchema = exports.UpdatePreferencesRequestSchema = exports.UpdateMeasurementsRequestSchema = exports.SetupProfileRequestSchema = exports.FeedbackSchema = exports.AICacheEntrySchema = exports.OutfitRecommendationSchema = exports.AIProviderEnum = exports.ImageStatusEnum = exports.OutfitSchema = exports.WeatherContextSchema = exports.ClothingItemSchema = exports.ClothingCategoryEnum = exports.UserProfileSchema = exports.DailyQuotaSchema = exports.LocationSchema = exports.UserPreferencesSchema = exports.GenderEnum = exports.BudgetEnum = exports.OccasionEnum = exports.StyleEnum = exports.BodyMeasurementsSchema = void 0;
const zod_1 = require("zod");
// ─────────────────────────────────────────────────────────────────
// DB SCHEMAS
// ─────────────────────────────────────────────────────────────────
exports.BodyMeasurementsSchema = zod_1.z.object({
    height: zod_1.z.number().min(50).max(300),
    weight: zod_1.z.number().min(20).max(500),
    chest: zod_1.z.number().min(40).max(200).optional(),
    waist: zod_1.z.number().min(30).max(200).optional(),
    hips: zod_1.z.number().min(40).max(200).optional(),
    inseam: zod_1.z.number().min(20).max(120).optional(),
    shoulderWidth: zod_1.z.number().min(20).max(80).optional(),
});
exports.StyleEnum = zod_1.z.enum([
    'casual', 'formal', 'streetwear', 'business',
    'athletic', 'bohemian', 'minimalist', 'vintage',
]);
exports.OccasionEnum = zod_1.z.enum([
    'work', 'date', 'party', 'gym', 'travel',
    'wedding', 'casual', 'outdoor',
]);
exports.BudgetEnum = zod_1.z.enum(['budget', 'mid', 'luxury']);
exports.GenderEnum = zod_1.z.enum([
    'male', 'female', 'non-binary', 'prefer-not-to-say',
]);
exports.UserPreferencesSchema = zod_1.z.object({
    styles: zod_1.z.array(exports.StyleEnum).min(1).max(5),
    colors: zod_1.z.array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10),
    avoidColors: zod_1.z.array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)).max(10),
    occasions: zod_1.z.array(exports.OccasionEnum).min(1).max(8),
    budget: exports.BudgetEnum,
    gender: exports.GenderEnum,
    brands: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    avoidBrands: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
});
exports.LocationSchema = zod_1.z.object({
    city: zod_1.z.string().max(100).min(1),
    country: zod_1.z.string().length(2),
    lat: zod_1.z.number().min(-90).max(90),
    lon: zod_1.z.number().min(-180).max(180),
});
exports.DailyQuotaSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    count: zod_1.z.number().int().min(0).max(5),
});
exports.UserProfileSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    clerkUserId: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().max(100),
    measurements: exports.BodyMeasurementsSchema.optional(),
    preferences: exports.UserPreferencesSchema.optional(),
    location: exports.LocationSchema.optional(),
    dailyQuota: exports.DailyQuotaSchema,
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.ClothingCategoryEnum = zod_1.z.enum([
    'top', 'bottom', 'shoes', 'outerwear',
    'accessory', 'dress', 'suit',
]);
exports.ClothingItemSchema = zod_1.z.object({
    category: exports.ClothingCategoryEnum,
    name: zod_1.z.string().max(200).min(1),
    description: zod_1.z.string().max(500).min(1),
    color: zod_1.z.string().max(50).min(1),
    material: zod_1.z.string().max(100).optional(),
    style: zod_1.z.string().max(100).min(1),
    priceRange: exports.BudgetEnum,
    searchTerms: zod_1.z.array(zod_1.z.string().max(50)).min(1).max(5),
});
exports.WeatherContextSchema = zod_1.z.object({
    temp: zod_1.z.number().min(-60).max(60),
    condition: zod_1.z.string().max(100),
    humidity: zod_1.z.number().min(0).max(100),
    windSpeed: zod_1.z.number().min(0).max(300),
});
exports.OutfitSchema = zod_1.z.object({
    title: zod_1.z.string().max(200).min(1),
    description: zod_1.z.string().max(1000).min(1),
    items: zod_1.z.array(exports.ClothingItemSchema).min(2).max(8),
    stylingTips: zod_1.z.array(zod_1.z.string().max(300)).max(5),
    colorPalette: zod_1.z.array(zod_1.z.string()).max(6),
    confidenceScore: zod_1.z.number().min(0).max(1),
});
exports.ImageStatusEnum = zod_1.z.enum([
    'pending', 'generating', 'ready', 'failed',
]);
exports.AIProviderEnum = zod_1.z.enum(['gemini', 'openai', 'cached']);
exports.OutfitRecommendationSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    userId: zod_1.z.string().min(1),
    requestHash: zod_1.z.string().min(1),
    occasion: zod_1.z.string().max(100).min(1),
    weatherContext: exports.WeatherContextSchema,
    outfit: exports.OutfitSchema,
    imageUrl: zod_1.z.string().url().optional(),
    imageStatus: exports.ImageStatusEnum,
    aiProvider: exports.AIProviderEnum,
    cacheHit: zod_1.z.boolean(),
    feedback: zod_1.z.object({
        rating: zod_1.z.enum(['like', 'dislike']).optional(),
        savedAt: zod_1.z.date().optional(),
    }),
    expiresAt: zod_1.z.date(),
    createdAt: zod_1.z.date(),
});
exports.AICacheEntrySchema = zod_1.z.object({
    _id: zod_1.z.string(),
    cacheKey: zod_1.z.string().min(1),
    requestType: zod_1.z.enum(['outfit', 'trend', 'image', 'weather']),
    response: zod_1.z.unknown(),
    ttlExpiresAt: zod_1.z.date(),
    hitCount: zod_1.z.number().int().min(0),
    createdAt: zod_1.z.date(),
});
exports.FeedbackSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    userId: zod_1.z.string().min(1),
    recommendationId: zod_1.z.string().min(1),
    rating: zod_1.z.enum(['like', 'dislike']),
    reason: zod_1.z.string().max(500).optional(),
    createdAt: zod_1.z.date(),
});
// ─────────────────────────────────────────────────────────────────
// API REQUEST SCHEMAS
// ─────────────────────────────────────────────────────────────────
exports.SetupProfileRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100),
    email: zod_1.z.string().email(),
    measurements: exports.BodyMeasurementsSchema.optional(),
    preferences: exports.UserPreferencesSchema.optional(),
    location: exports.LocationSchema.optional(),
});
exports.UpdateMeasurementsRequestSchema = exports.BodyMeasurementsSchema;
exports.UpdatePreferencesRequestSchema = exports.UserPreferencesSchema;
exports.RecommendRequestSchema = zod_1.z.object({
    occasion: exports.OccasionEnum,
    description: zod_1.z.string().max(500).optional(),
    location: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        lon: zod_1.z.number().min(-180).max(180),
    }).optional(),
});
exports.FeedbackRequestSchema = zod_1.z.object({
    rating: zod_1.z.enum(['like', 'dislike']),
    reason: zod_1.z.string().max(500).optional(),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
});
// ─────────────────────────────────────────────────────────────────
// AI OUTPUT CONTRACT SCHEMAS (what LLM must return)
// ─────────────────────────────────────────────────────────────────
exports.AIOutfitOutputSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(1000),
    items: zod_1.z.array(zod_1.z.object({
        category: exports.ClothingCategoryEnum,
        name: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().min(1).max(500),
        color: zod_1.z.string().min(1).max(50),
        material: zod_1.z.string().max(100).optional(),
        style: zod_1.z.string().min(1).max(100),
        priceRange: exports.BudgetEnum,
        searchTerms: zod_1.z.array(zod_1.z.string().max(50)).min(1).max(5),
    })).min(2).max(8),
    stylingTips: zod_1.z.array(zod_1.z.string().max(300)).min(1).max(5),
    colorPalette: zod_1.z.array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(2).max(6),
    confidenceScore: zod_1.z.number().min(0).max(1),
});
exports.AITrendOutputSchema = zod_1.z.object({
    trends: zod_1.z.array(zod_1.z.object({
        trend: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().min(1).max(500),
        relevance: zod_1.z.number().min(0).max(1),
    })).min(1).max(10),
    location: zod_1.z.string(),
    season: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
//# sourceMappingURL=index.js.map