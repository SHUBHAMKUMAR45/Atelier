import type { Request, Response, NextFunction } from 'express'
import { trendsService }                   from '../services/trends.service'
import { problemDetails, successResponse } from '../middleware'

export async function getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const location = (req.query['location'] as string | undefined) ?? 'Global'
    const trends   = await trendsService.getTrends(location, req.traceId ?? "")
    res.json(successResponse(trends, req.traceId ?? ""))
  } catch (err) { next(err) }
}
