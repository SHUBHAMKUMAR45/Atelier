import type { Request, Response, NextFunction } from 'express'
import { weatherService }                  from '../services/weather.service'
import { problemDetails, successResponse } from '../middleware'

export async function getWeather(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lat = Number(req.query['lat'])
    const lon = Number(req.query['lon'])
    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(400, 'lat and lon query parameters are required and must be numbers', req.traceId))
      return
    }
    const weather = await weatherService.getWeather(lat, lon)
    res.json(successResponse(weather, req.traceId))
  } catch (err) { next(err) }
}
