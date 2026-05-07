import type { Request, Response, NextFunction } from 'express'
import { profileService }                            from '../services/profile.service'
import { problemDetails, successResponse }           from '../middleware'

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getProfile(req.userId)
    if (!profile) {
      res.status(404).json(problemDetails(404, 'Profile not found', req.traceId ?? ""))
      return
    }
    res.json(successResponse(profile, req.traceId ?? ""))
  } catch (err) { next(err) }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getProfile(req.userId)
    // If Lazy Sync worked, this should ALWAYS exist. 
    res.json(successResponse(profile || { clerkUserId: req.userId, guest: true }, req.traceId ?? ""))
  } catch (err) { next(err) }
}

export async function setupProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.upsertProfile(req.userId, req.body)
    res.json(successResponse(profile, req.traceId ?? ""))
  } catch (err) { next(err) }
}

export async function updateMeasurements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await profileService.updateMeasurements(req.userId, req.body)
    res.json(successResponse({ updated: true }, req.traceId ?? ""))
  } catch (err) { next(err) }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await profileService.updatePreferences(req.userId, req.body)
    res.json(successResponse({ updated: true }, req.traceId ?? ""))
  } catch (err) { next(err) }
}

export async function getQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quota = await profileService.getQuotaStatus(req.userId)
    res.json(successResponse(quota, req.traceId ?? ""))
  } catch (err) { next(err) }
}
