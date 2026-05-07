import { APIError, type APIResponse, type ClientConfig } from './types'

export class AtelierClient {
  private config: ClientConfig

  constructor(config: ClientConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/api\/v1\/?$/, '')
    }
  }

  /**
   * Updates the token provider at runtime.
   * Useful for React applications where the token getter becomes available after initialization.
   */
  public setTokenProvider(provider: () => Promise<string | null>): void {
    this.config.getToken = provider
  }

  /**
   * Main request runner with absolute standard protocol adherence.
   */
  async request<T>(
    path:    string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const { baseUrl, getToken, debug } = this.config
    const url = `${baseUrl}/api/v1${path}`
    const token = await getToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    }

    if (debug && retryCount === 0) {
      // eslint-disable-next-line no-console
      console.log(`[AtelierAPI] ${options.method ?? 'GET'} ${url}`)
    }

    try {
      // Compatibility-friendly timeout logic with configurable thresholds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timeoutValue = (options as any).timeout ?? 30_000 // 30s default for AI generation
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutValue)

      const res = await fetch(url, {
        ...options,
        headers,
        signal: options.signal ?? controller.signal,
      })
      clearTimeout(timeoutId)

      // Strict enforcement of JSON response
      const body = await res.json() as APIResponse<T>

      if (!res.ok || !body.success) {
        // Handle 401 Unauthorized
        if (res.status === 401 && this.config.onUnauthorized) {
          this.config.onUnauthorized()
        }

        // Retry transient errors (429, 503, Network)
        if (retryCount < 3 && (res.status === 429 || res.status === 503)) {
          const delay = 1000 * Math.pow(2, retryCount)
          await new Promise(r => setTimeout(r, delay))
          return this.request<T>(path, options, retryCount + 1)
        }

        throw new APIError(
          body.error ?? `HTTP Error ${res.status}`,
          res.status,
          body.traceId
        )
      }

      if (body.data === null) {
        throw new APIError('Response data is null', 500, body.traceId)
      }

      return body.data as T
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err instanceof APIError) throw err

      // Handle network failures with retries
      const isNetworkError = err.name === 'AbortError' || err.message?.toLowerCase().includes('fetch')
      if (retryCount < 3 && isNetworkError) {
        const delay = 1000 * Math.pow(2, retryCount)
        await new Promise(r => setTimeout(r, delay))
        return this.request<T>(path, options, retryCount + 1)
      }

      throw err
    }
  }

  // Helper for GET requests
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  // Helper for POST requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T>(path: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    })
  }

  // Helper for PATCH requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patch<T>(path: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    })
  }

  // Helper for DELETE requests
  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}
