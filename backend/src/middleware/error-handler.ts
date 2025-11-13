// Error handling middleware
import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error]', err)

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({ error: 'Database error', details: err.message })
    return
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message })
    return
  }

  // Default error
  res.status(500).json({ error: 'Internal server error' })
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' })
}
