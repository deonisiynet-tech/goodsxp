import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Помилка валідації',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Внутрішня помилка сервера',
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  console.error(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  console.error(`   Headers: ${JSON.stringify(req.headers?.authorization ? { auth: 'Bearer ***' } : { auth: 'none' })}`);
  console.error(`   Cookies: ${JSON.stringify(Object.keys(req.cookies || {}))}`);
  const error = new AppError(`Маршрут не знайдено: ${req.originalUrl}`, 404);
  next(error);
};
