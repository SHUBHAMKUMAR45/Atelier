import type { Request, Response, NextFunction } from 'express'
import { recommendationService }           from '../services/recommendation.service'
import { FeedbackModel }                   from '../db/models'
import { problemDetails, successResponse } from '../middleware'

export async function submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']
    if (!id) {
      res.status(400).setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(400, 'Missing recommendation id', req.traceId))
      return
    }
    const { rating, reason } = req.body as { rating: 'like' | 'dislike'; reason?: string }
    await recommendationService.submitFeedback(req.userId, id, rating, reason)
    await FeedbackModel.create({
      userId: req.userId, recommendationId: id, rating, reason, createdAt: new Date(),
    }).catch(() => { /* non-fatal */ })
    res.json(successResponse({ recorded: true }, req.traceId))
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      res.status(404).setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(404, err.message, req.traceId))
      return
    }
    next(err)
  }
}

export async function getSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await recommendationService.getSaved(req.userId)
    res.json(successResponse(items, req.traceId))
  } catch (err) { next(err) }
}
