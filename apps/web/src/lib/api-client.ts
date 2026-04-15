import type {
  OutfitRecommendation,
  UserProfile,
  RecommendRequest,
  SetupProfileRequest,
  BodyMeasurements,
  UserPreferences,
  AITrendOutput,
  WeatherContext,
  FeedbackRequest,
} from '../../../../packages/shared/src/schemas'

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean
  data?:   T
  error?:  string
  details?: Array<{ field: string; message: string }>
  traceId?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  items:   T[]
  total:   number
  page:    number
  pages:   number
}

export interface QuotaStatus {
  used:      number
  limit:     number
  remaining: number
  resetAt:   string
}

export class APIError extends Error {
  constructor(
    message:           string,
    public statusCode: number,
    public traceId?:   string,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// ─────────────────────────────────────────────────────────────────
// BASE CLIENT
// ─────────────────────────────────────────────────────────────────

const API_BASE = (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:5000').replace(/\/api\/v1\/?$/, '')

async function apiRequest<T>(
  path:    string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(init.headers as Record<string, string>),
  }

  const url = `${API_BASE}/api/v1${path}`
  console.log(`[API REQUEST] ${init.method ?? 'GET'} ${url}`)

  const res = await fetch(url, {
    ...init,
    headers,
    signal: options.signal ?? AbortSignal.timeout(30_000),
  })

  const body = await res.json() as APIResponse<T>

  if (!res.ok || !body.success) {
    if (res.status === 400 && body.details) {
      console.group('API Validation Error (400)')
      console.table(body.details)
      console.groupEnd()
    } else if (res.status === 400 && (body as any).errors) {
       // Support both formats (Problem Details and custom)
       console.group('API Validation Error (400)')
       console.table((body as any).errors)
       console.groupEnd()
    }

    throw new APIError(
      body.error ?? `Request failed: ${res.status}`,
      res.status,
      body.traceId,
    )
  }

  return body.data as T
}

// ─────────────────────────────────────────────────────────────────
// API METHODS
// ─────────────────────────────────────────────────────────────────

export const api = {
  // ── Profile ─────────────────────────────────────────────────────

  profile: {
    get: (token: string): Promise<UserProfile> =>
      apiRequest<UserProfile>('/profile', { token }),

    setup: (token: string, data: SetupProfileRequest): Promise<UserProfile> =>
      apiRequest<UserProfile>('/profile/setup', {
        method: 'POST',
        body:   JSON.stringify(data),
        token,
      }),

    updateMeasurements: (token: string, data: BodyMeasurements): Promise<void> =>
      apiRequest<void>('/profile/measurements', {
        method: 'PATCH',
        body:   JSON.stringify(data),
        token,
      }),

    updatePreferences: (token: string, data: UserPreferences): Promise<void> =>
      apiRequest<void>('/profile/preferences', {
        method: 'PATCH',
        body:   JSON.stringify(data),
        token,
      }),

    getQuota: (token: string): Promise<QuotaStatus> =>
      apiRequest<QuotaStatus>('/profile/quota', { token }),
  },

  // ── Recommendations ──────────────────────────────────────────────

  recommend: {
    generate: (token: string, data: RecommendRequest): Promise<OutfitRecommendation> =>
      apiRequest<OutfitRecommendation>('/recommend', {
        method: 'POST',
        body:   JSON.stringify(data),
        token,
      }),

    getHistory: async (
      token: string,
      page  = 1,
      limit = 10,
    ): Promise<PaginatedResponse<OutfitRecommendation>> => {
      const res = await fetch(
        `${API_BASE}/api/v1/recommend/history?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30_000),
        },
      )
      const body = await res.json() as any
      if (!res.ok || !body.success) {
        throw new APIError(body.error ?? `HTTP ${res.status}`, res.status, body.traceId)
      }
      return {
        success: body.success,
        items: body.data ?? [],
        total: body.meta?.total ?? 0,
        page: body.meta?.page ?? page,
        pages: body.meta?.pages ?? 1
      }
    },

    getById: (token: string, id: string): Promise<OutfitRecommendation> =>
      apiRequest<OutfitRecommendation>(`/recommend/${id}`, { token }),

    delete: (token: string, id: string): Promise<void> =>
      apiRequest<void>(`/recommend/${id}`, { method: 'DELETE', token }),

    getSaved: (token: string): Promise<OutfitRecommendation[]> =>
      apiRequest<OutfitRecommendation[]>('/feedback/saved', { token }),
  },

  // ── Feedback ─────────────────────────────────────────────────────

  feedback: {
    submit: (token: string, id: string, data: FeedbackRequest): Promise<void> =>
      apiRequest<void>(`/feedback/${id}`, {
        method: 'POST',
        body:   JSON.stringify(data),
        token,
      }),
  },

  // ── Weather ──────────────────────────────────────────────────────

  weather: {
    get: (token: string, lat: number, lon: number): Promise<WeatherContext> =>
      apiRequest<WeatherContext>(`/weather?lat=${lat}&lon=${lon}`, { token }),
  },

  // ── Trends ───────────────────────────────────────────────────────

  trends: {
    get: (token: string): Promise<AITrendOutput> =>
      apiRequest<AITrendOutput>('/trends', { token }),
  },
}
