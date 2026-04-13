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
  // 🔒 SECURITY: В production не логуємо повну помилку (може містити sensitive data)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    console.error('Error:', err instanceof AppError ? err.message : 'Internal server error');
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Помилка валідації',
      // 🔒 SECURITY: In production, return generic validation errors
      details: process.env.NODE_ENV === 'development'
        ? err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        : [{ message: 'Невірний формат даних' }],
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // 🔒 SECURITY: В production не розкриваємо деталі помилок клієнту
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
