import { Router } from 'express'
import * as ctrl from '../controllers/wardrobe.controller'
import { authMiddleware } from '../middleware/rbac.middleware'
import { validateBody } from '../middleware'
import { CreateWardrobeItemRequestSchema } from '../../../../packages/shared/src/schemas'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

router.get(   '/',    ctrl.getItems)
router.post(  '/',    validateBody(CreateWardrobeItemRequestSchema), ctrl.addItem)
router.delete('/:id', ctrl.deleteItem)

export default router
