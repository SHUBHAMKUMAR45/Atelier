export interface APIResponse<T> {
  success: boolean
  data:    T | null
  error:   string | null
  traceId?: string
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page:  number
  pages: number
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public traceId?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface ClientConfig {
  baseUrl: string
  getToken: () => Promise<string | null>
  onUnauthorized?: () => void
  debug?: boolean
}

export interface QuotaStatus {
  used:      number
  limit:     number
  remaining: number
  resetAt:   string
}
