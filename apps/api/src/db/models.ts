import mongoose, { Schema, model, type Document, type Model } from 'mongoose'
import type {
  UserProfile,
  OutfitRecommendation,
  AICacheEntry,
  Feedback,
  WardrobeItem,
} from '../../../../packages/shared/src/schemas'

// ─────────────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────────────

type UserProfileDocument = Omit<UserProfile, '_id'> & Document

const MeasurementsSchema = new Schema({
  height:        { type: Number, required: true },
  weight:        { type: Number, required: true },
  chest:         Number,
  waist:         Number,
  hips:          Number,
  inseam:        Number,
  shoulderWidth: Number,
}, { _id: false })

const PreferencesSchema = new Schema({
  styles:      [{ type: String }],
  colors:      [{ type: String }],
  avoidColors: [{ type: String }],
  occasions:   [{ type: String }],
  budget:      { type: String, required: true },
  gender:      { type: String, required: true },
  brands:      [{ type: String }],
  avoidBrands: [{ type: String }],
}, { _id: false })

const LocationSchema = new Schema({
  city:    { type: String, required: true },
  country: { type: String, required: true },
  lat:     { type: Number, required: true },
  lon:     { type: Number, required: true },
}, { _id: false })

const UserProfileMongoSchema = new Schema<UserProfileDocument>(
  {
    clerkUserId:  { type: String, required: true, index: true, unique: true },
    email:        { type: String, required: true },
    displayName:  { type: String, required: true },
    measurements: MeasurementsSchema,
    preferences:  PreferencesSchema,
    location:     LocationSchema,
    dailyQuota: {
      date:  { type: String, required: true },
      count: { type: Number, required: true, default: 0 },
    },
  },
  { timestamps: true },
)

export const UserProfileModel: Model<UserProfileDocument> =
  mongoose.models['users'] ??
  model<UserProfileDocument>('users', UserProfileMongoSchema)

// ─────────────────────────────────────────────────────────────────
// OUTFIT RECOMMENDATION
// ─────────────────────────────────────────────────────────────────

type RecommendationDocument = Omit<OutfitRecommendation, '_id'> & Document

const ClothingItemMongoSchema = new Schema({
  category:    { type: String, required: true },
  name:        { type: String, required: true },
  description: { type: String, required: true },
  color:       { type: String, required: true },
  material:    String,
  style:       { type: String, required: true },
  priceRange:  { type: String, required: true },
  searchTerms: [{ type: String }],
}, { _id: false })

const OutfitMongoSchema = new Schema({
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  items:           [ClothingItemMongoSchema],
  stylingTips:     [{ type: String }],
  colorPalette:    [{ type: String }],
  confidenceScore: { type: Number, required: true },
}, { _id: false })

const RecommendationMongoSchema = new Schema<RecommendationDocument>(
  {
    userId:      { type: String, required: true, index: true },
    requestHash: { type: String, required: true, index: true, unique: true },
    occasion:    { type: String, required: true },
    weatherContext: {
      temp:      { type: Number, required: true },
      condition: { type: String, required: true },
      humidity:  { type: Number, required: true },
      windSpeed: { type: Number, required: true },
    },
    outfit:      OutfitMongoSchema,
    imageUrl:    String,
    imageStatus: { type: String, required: true, default: 'pending' },
    aiProvider:  { type: String, required: true },
    cacheHit:    { type: Boolean, required: true, default: false },
    feedback: {
      rating:  String,
      savedAt: Date,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// Compound index for history queries
RecommendationMongoSchema.index({ userId: 1, createdAt: -1 })

// TTL auto-delete
RecommendationMongoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RecommendationModel: Model<RecommendationDocument> =
  mongoose.models['recommendations'] ??
  model<RecommendationDocument>('recommendations', RecommendationMongoSchema)

// ─────────────────────────────────────────────────────────────────
// AI CACHE
// ─────────────────────────────────────────────────────────────────

type AICacheDocument = Omit<AICacheEntry, '_id'> & Document

const AICacheMongoSchema = new Schema<AICacheDocument>(
  {
    cacheKey:     { type: String, required: true, unique: true, index: true },
    requestType:  { type: String, required: true },
    response:     { type: Schema.Types.Mixed, required: true },
    ttlExpiresAt: { type: Date, required: true },
    hitCount:     { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

AICacheMongoSchema.index({ ttlExpiresAt: 1 }, { expireAfterSeconds: 0 })

export const AICacheModel: Model<AICacheDocument> =
  mongoose.models['ai_cache'] ??
  model<AICacheDocument>('ai_cache', AICacheMongoSchema)

// ─────────────────────────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────────────────────────

type FeedbackDocument = Omit<Feedback, '_id'> & Document

const FeedbackMongoSchema = new Schema<FeedbackDocument>(
  {
    userId:           { type: String, required: true, index: true },
    recommendationId: { type: String, required: true },
    rating:           { type: String, required: true },
    reason:           String,
  },
  { timestamps: true },
)

FeedbackMongoSchema.index({ userId: 1, recommendationId: 1 })

export const FeedbackModel: Model<FeedbackDocument> =
  mongoose.models['feedback'] ??
  model<FeedbackDocument>('feedback', FeedbackMongoSchema)

// ─────────────────────────────────────────────────────────────────
// WARDROBE
// ─────────────────────────────────────────────────────────────────

type WardrobeItemDocument = Omit<WardrobeItem, '_id'> & Document

const WardrobeItemMongoSchema = new Schema<WardrobeItemDocument>(
  {
    userId:    { type: String, required: true, index: true },
    category:  { type: String, required: true },
    name:      { type: String, required: true },
    imageUrl:  { type: String, required: true },
    color:     String,
    brand:     String,
    lastWorn:  String,
  },
  { timestamps: true },
)

export const WardrobeItemModel: Model<WardrobeItemDocument> =
  mongoose.models['wardrobe_items'] ??
  model<WardrobeItemDocument>('wardrobe_items', WardrobeItemMongoSchema)
