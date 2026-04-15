import { Router, type Router as ExpressRouter } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import * as ctrl from '../controllers/trends.controller'

const router: ExpressRouter = Router()
router.use(authMiddleware)

router.get('/', ctrl.getTrends)

export default router
