import { Router, type Router as ExpressRouter } from 'express'
import { authMiddleware }  from '../middleware/auth.middleware'
import { validateBody }    from '../middleware'
import {
  SetupProfileRequestSchema,
  UpdateMeasurementsRequestSchema,
  UpdatePreferencesRequestSchema,
} from '../../../../packages/shared/src/schemas'
import * as ctrl from '../controllers/profile.controller'

const router: ExpressRouter = Router()
router.use(authMiddleware)

router.get(   '/',              ctrl.getProfile)
router.get(   '/me',            ctrl.getMe)
router.post(  '/setup',         validateBody(SetupProfileRequestSchema),         ctrl.setupProfile)
router.patch( '/measurements',  validateBody(UpdateMeasurementsRequestSchema),   ctrl.updateMeasurements)
router.patch( '/preferences',   validateBody(UpdatePreferencesRequestSchema),    ctrl.updatePreferences)
router.get(   '/quota',         ctrl.getQuota)

export default router
