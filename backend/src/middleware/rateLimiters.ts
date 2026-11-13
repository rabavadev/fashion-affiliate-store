import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Creates a general API rate limiter: 120 requests per 15 minutes.
 */
export function createGeneralLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.',
    },
  });
}

/**
 * Creates an outbound affiliate redirection rate limiter: 30 requests per minute.
 * Prevents automated link-scraping and affiliate click-farming bots.
 */
export function createRedirectLimiter(max: number = 30): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 1 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Outbound redirection rate limit exceeded. Please wait before attempting further redirects.',
    },
  });
}

export const generalLimiter = createGeneralLimiter();
export const redirectLimiter = createRedirectLimiter();
