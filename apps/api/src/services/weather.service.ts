import { z } from 'zod'
import { WeatherContextSchema } from '../../../../packages/shared/src/schemas'
import { hashCacheKey } from '../../../../packages/shared/src/utils'
import { cacheService }  from './cache.service'
import { logger }        from '../config/logger'
import { env }           from '../config/env'
import type { WeatherContext } from '../../../../packages/shared/src/schemas'

const OWM_API_URL = 'https://api.openweathermap.org/data/2.5/weather'

const OWMResponseSchema = z.object({
  main: z.object({
    temp:     z.number(),
    humidity: z.number(),
  }),
  weather: z.array(z.object({ description: z.string() })).min(1),
  wind:    z.object({ speed: z.number() }),
})

export class WeatherService {
  async getWeather(lat: number, lon: number): Promise<WeatherContext> {
    const cacheKey = hashCacheKey({ lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10, t: 'weather' })

    // 1. Cache check (30-min TTL)
    const cached = await cacheService.getWeather(cacheKey)
    if (cached) {
      const parsed = WeatherContextSchema.safeParse(cached)
      if (parsed.success) return parsed.data
    }

    // 2. Fetch from OpenWeatherMap
    try {
      const url    = `${OWM_API_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${env.WEATHER_API_KEY}`
      const res    = await fetch(url, { signal: AbortSignal.timeout(5_000) })

      if (!res.ok) throw new Error(`OWM API error: ${res.status}`)

      const raw      = await res.json() as unknown
      const parsed   = OWMResponseSchema.safeParse(raw)

      if (!parsed.success) throw new Error('OWM response schema mismatch')

      const weather: WeatherContext = {
        temp:      Math.round(parsed.data.main.temp),
        condition: parsed.data.weather[0]?.description ?? 'clear',
        humidity:  parsed.data.main.humidity,
        windSpeed: parsed.data.wind.speed,
      }

      await cacheService.setWeather(cacheKey, weather)
      return weather
    } catch (err) {
      logger.warn({ err, lat, lon }, 'Weather API failed — using fallback')
      return this.getSeasonalFallback()
    }
  }

  // Fallback based on current month — public so recommendation service can call it
  getSeasonalFallback(): WeatherContext {
    const month = new Date().getMonth() // 0-11
    const isSummer  = month >= 5 && month <= 8
    const isWinter  = month === 11 || month <= 1

    return {
      temp:      isSummer ? 28 : isWinter ? 5 : 18,
      condition: 'partly cloudy',
      humidity:  60,
      windSpeed: 10,
    }
  }
}

export const weatherService = new WeatherService()
