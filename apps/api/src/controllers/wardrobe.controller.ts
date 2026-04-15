import type { Request, Response, NextFunction } from 'express'
import { wardrobeService } from '../services/wardrobe.service'
import { successResponse } from '../middleware'

export async function getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await wardrobeService.getItems(req.userId)
    res.json(successResponse(items, req.traceId))
  } catch (err) { next(err) }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await wardrobeService.addItem(req.userId, req.body)
    res.json(successResponse(item, req.traceId))
  } catch (err) { next(err) }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await wardrobeService.deleteItem(req.userId, req.params.id)
    res.json(successResponse({ deleted: true }, req.traceId))
  } catch (err) { next(err) }
}
