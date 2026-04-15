import type { Request, Response, NextFunction } from 'express'
import {
  recommendationService,
  QuotaExceededError,
  ProfileNotFoundError,
  ProfileIncompleteError,
} from '../services/recommendation.service'
import { problemDetails, successResponse, paginatedResponse } from '../middleware'

export async function generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await recommendationService.generate(req.userId, req.body, req.traceId)
    res.status(201).json(successResponse(result, req.traceId))
  } catch (err) {
    if (err instanceof QuotaExceededError || err instanceof ProfileNotFoundError || err instanceof ProfileIncompleteError) {
      res.status(err.statusCode)
        .setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(err.statusCode, err.message, req.traceId))
      return
    }
    next(err)
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = Number(req.query['page']  ?? 1)
    const limit = Number(req.query['limit'] ?? 10)
    const result = await recommendationService.getHistory(req.userId, page, limit)
    res.json(paginatedResponse(result.items, result.total, result.page, limit, req.traceId))
  } catch (err) { next(err) }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']
    if (!id) {
      res.status(400).setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(400, 'Missing recommendation id', req.traceId))
      return
    }
    const item = await recommendationService.getById(req.userId, id)
    if (!item) {
      res.status(404).setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(404, 'Recommendation not found', req.traceId))
      return
    }
    res.json(successResponse(item, req.traceId))
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id']
    if (!id) {
      res.status(400).setHeader('Content-Type', 'application/problem+json')
        .json(problemDetails(400, 'Missing recommendation id', req.traceId))
      return
    }
    const deleted = await recommendationService.delete(req.userId, id)
    res.json(successResponse({ deleted }, req.traceId))
  } catch (err) { next(err) }
}

export async function getSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await recommendationService.getSaved(req.userId)
    res.json(successResponse(items, req.traceId))
  } catch (err) { next(err) }
}
