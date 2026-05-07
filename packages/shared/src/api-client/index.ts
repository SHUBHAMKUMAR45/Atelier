import { AtelierClient } from './AtelierClient'
import type { 
  UserProfile, 
  SetupProfileRequest, 
  BodyMeasurements, 
  UserPreferences,
  OutfitRecommendation,
  RecommendRequest,
  AITrendOutput,
  WeatherContext,
  WardrobeItem,
  CreateWardrobeItemRequest,
  FeedbackRequest
} from '../schemas'
import type { ClientConfig, PaginatedData } from './types'

export * from './types'
export * from './AtelierClient'

export class AtelierAPI extends AtelierClient {
  constructor(config: ClientConfig) {
    super(config)
  }

  // ── Profile ─────────────────────────────────────────────────────
  public profile = {
    get: (): Promise<UserProfile> => 
      this.get<UserProfile>('/profile'),

    setup: (data: SetupProfileRequest): Promise<UserProfile> =>
      this.post<UserProfile>('/profile/setup', data),

    updateMeasurements: (data: BodyMeasurements): Promise<void> =>
      this.patch<void>('/profile/measurements', data),

    updatePreferences: (data: UserPreferences): Promise<void> =>
      this.patch<void>('/profile/preferences', data),

    getQuota: (): Promise<{ used: number; limit: number; remaining: number; resetAt: string }> =>
      this.get<{ used: number; limit: number; remaining: number; resetAt: string }>('/profile/quota'),
  }

  // ── Recommendations ──────────────────────────────────────────────
  public recommend = {
    generate: (data: RecommendRequest): Promise<OutfitRecommendation> =>
      this.post<OutfitRecommendation>('/recommend', data),

    getHistory: (page = 1, limit = 10): Promise<PaginatedData<OutfitRecommendation>> =>
      this.get<PaginatedData<OutfitRecommendation>>(`/recommend/history?page=${page}&limit=${limit}`),

    getById: (id: string): Promise<OutfitRecommendation> =>
      this.get<OutfitRecommendation>(`/recommend/${id}`),

    delete: (id: string): Promise<void> =>
      this.delete<void>(`/recommend/${id}`),

    getSaved: (): Promise<OutfitRecommendation[]> =>
      this.get<OutfitRecommendation[]>('/feedback/saved'),
  }

  // ── Wardrobe ───────────────────────────────────────────────────
  public wardrobe = {
    get: (): Promise<WardrobeItem[]> =>
      this.get<WardrobeItem[]>('/wardrobe'),

    add: (data: CreateWardrobeItemRequest): Promise<WardrobeItem> =>
      this.post<WardrobeItem>('/wardrobe', data),

    delete: (id: string): Promise<void> =>
      this.delete<void>(`/wardrobe/${id}`),

    getUploadSignature: (): Promise<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }> =>
      this.get<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>('/wardrobe/signature'),
  }

  // ── Trends & Weather ───────────────────────────────────────────
  public trends = {
    get: (location?: string): Promise<AITrendOutput> =>
      this.get<AITrendOutput>(`/trends${location ? `?location=${encodeURIComponent(location)}` : ''}`),
  }

  public weather = {
    get: (lat: number, lon: number): Promise<WeatherContext> =>
      this.get<WeatherContext>(`/weather?lat=${lat}&lon=${lon}`),
  }

  public feedback = {
    submit: (id: string, data: FeedbackRequest): Promise<void> =>
      this.post<void>(`/feedback/${id}`, data),
  }
}
