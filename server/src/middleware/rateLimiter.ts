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
 * ✅ Більш мягкий rate limiter для обычных API маршрутів
 * ✅ 60 запитів/хвилину — достатньо для активного користування каталогом
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // ✅ 60 requests per window (збільшено з 30)
  message: {
    error: 'Занадто багато запитів. Спробуйте пізніше.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Строгий rate limiter для чувствительных операций
 * (регистрация, логин, отправка отзывов, создание заказов)
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
