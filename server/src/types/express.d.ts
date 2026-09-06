declare global {
  namespace Express {
    interface Request { userId?: number; userRole?: 'USER' | 'ADMIN' }
  }
}

export {}
