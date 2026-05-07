import { Router, type Router as ExpressRouter } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { validateBody }   from '../middleware'
import { FeedbackRequestSchema } from '../../../../packages/shared/src/schemas'
import * as ctrl from '../controllers/feedback.controller'

const router: ExpressRouter = Router()
router.use(authMiddleware)

router.post( '/:id',  validateBody(FeedbackRequestSchema), ctrl.submitFeedback)
router.get(  '/saved',                                     ctrl.getSaved)

export default router
