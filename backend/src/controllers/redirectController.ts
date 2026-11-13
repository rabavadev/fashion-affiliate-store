import { Request, Response } from 'express';
import { validateTargetUrl, resolveProductRedirect } from '../services/redirectService';

/**
 * Applies mandatory anti-caching and security headers on outbound redirect responses.
 */
function applyRedirectSecurityHeaders(res: Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Mode A: Outbound redirection by product ID.
 * Lookups the curated product and performs a safe 302 redirect.
 */
export function handleProductRedirect(req: Request, res: Response): void {
  const { productId } = req.params;
  const result = resolveProductRedirect(productId);

  if (!result.valid) {
    res.status(result.status).json({
      status: 'error',
      message: result.message,
    });
    return;
  }

  applyRedirectSecurityHeaders(res);
  res.redirect(302, result.sanitizedUrl);
}

/**
 * Mode B: Dynamic outbound redirection with multi-stage domain whitelist validation.
 */
export function handleUrlRedirect(req: Request, res: Response): void {
  const urlParam = req.query.url;
  const result = validateTargetUrl(urlParam);

  if (!result.valid) {
    res.status(result.status).json({
      status: 'error',
      message: result.message,
    });
    return;
  }

  applyRedirectSecurityHeaders(res);
  res.redirect(302, result.sanitizedUrl);
}
