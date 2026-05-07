import { Router, type Router as ExpressRouter } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import * as ctrl from '../controllers/weather.controller'

const router: ExpressRouter = Router()
router.use(authMiddleware)

router.get('/', ctrl.getWeather)

export default router
