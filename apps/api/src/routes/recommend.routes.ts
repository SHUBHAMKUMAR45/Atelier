import { Router, type Router as ExpressRouter } from 'express'
import { authMiddleware }                               from '../middleware/auth.middleware'
import { validateBody, validateQuery, aiRateLimiter }  from '../middleware'
import {
  RecommendRequestSchema,
  PaginationSchema,
} from '../../../../packages/shared/src/schemas'
import * as ctrl from '../controllers/recommend.controller'

const router: ExpressRouter = Router()
router.use(authMiddleware)

router.post(   '/',        aiRateLimiter, validateBody(RecommendRequestSchema), ctrl.generate)
router.get(    '/history', validateQuery(PaginationSchema),                     ctrl.getHistory)
router.get(    '/saved',                                                         ctrl.getSaved)
router.get(    '/:id',                                                           ctrl.getById)
router.delete( '/:id',                                                           ctrl.remove)

export default router
