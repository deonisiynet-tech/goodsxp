import rateLimit from 'express-rate-limit';

/**
 * Rate limiter для админских маршрутов
 * 5 запросов в минуту
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  message: {
    error: 'Занадто багато запитів. Спробуйте пізніше.',
    retryAfter: 60,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Занадто багато запитів. Спробуйте пізніше.',
      retryAfter: 60,
    });
  },
});

/**
 * Более мягкий rate limiter для обычных API маршрутов
 * 30 запросов в минуту
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per window
  message: {
    error: 'Занадто багато запитів. Спробуйте пізніше.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Строгий rate limiter для чувствительных операций
 * 3 запроса в минуту
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per window
  message: {
    error: 'Занадто багато запитів. Спробуйте пізніше.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
