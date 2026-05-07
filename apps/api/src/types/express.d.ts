import { Role } from '../middleware/rbac.middleware'

declare global {
  namespace Express {
    interface Request {
      userId:  string
      traceId: string
      role:    Role
      permissions: string[]
    }
  }
}

export {}
