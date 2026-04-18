import rateLimit from 'express-rate-limit';

/**
 * Rate limiter для админских маршрутов
 * 🔒 OPTIMIZED: 100 запросов в минуту (было 5)
 * Адмін може редагувати товар з багатьма характеристиками — потрібно більше запитів
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window (збільшено з 5)
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
 * 🔒 Строгий rate limiter для чувствительных операций
 * (регистрация, логин, отправка отзывов, создание заказов)
 * ✅ 100 запросов за 15 минут на IP — баланс между безопасностью и UX
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Занадто багато запитів. Спробуйте пізніше.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

/**
 * ✅ Rate limiter спеціально для створення замовлень
 * Запобігає спаму фейковими замовленнями
 * 5 замовлень за 5 хвилин на одну IP-адресу
 */
export const orderRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 хвилин
  max: 5, // 5 замовлень за 5 хвилин
  message: {
    error: 'Занадто багато замовлень. Зачекайте кілька хвилин.',
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Занадто багато замовлень. Зачекайте кілька хвилин.',
      retryAfter: 300,
    });
  },
});

/**
 * 🔒 Rate limiter для reviews — запобігання спаму відгуків
 * 20 відгуків за 15 хвилин на IP
 */
export const reviewRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 reviews per 15 minutes
  message: {
    error: 'Занадто багато відгуків. Спробуйте пізніше.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});
