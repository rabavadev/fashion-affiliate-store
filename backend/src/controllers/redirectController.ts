import { Request, Response } from 'express';
import { validateTargetUrl, resolveProductRedirect, recordAffiliateClick } from '../services/redirectService';
import { getProductById } from '../services/catalogService';

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
 * Lookups the curated product from SQLite, logs the click into affiliate_clicks, and performs a safe 302 redirect.
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

  const product = getProductById(productId);
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const referrer = (req.headers['referer'] as string) || (req.headers['referrer'] as string) || 'direct';

  recordAffiliateClick({
    productId,
    retailerName: product?.retailer?.name || 'MANGO',
    destinationUrl: result.sanitizedUrl,
    clientIp,
    userAgent,
    referrer,
  });

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

  let retailerName = 'External Retailer';
  try {
    const parsed = new URL(result.sanitizedUrl);
    if (parsed.hostname.includes('mango')) retailerName = 'MANGO';
    else if (parsed.hostname.includes('nordstrom')) retailerName = 'Nordstrom';
    else if (parsed.hostname.includes('net-a-porter')) retailerName = 'NET-A-PORTER';
    else if (parsed.hostname.includes('asos')) retailerName = 'ASOS';
    else if (parsed.hostname.includes('farfetch')) retailerName = 'Farfetch';
    else if (parsed.hostname.includes('revolve')) retailerName = 'Revolve';
    else if (parsed.hostname.includes('zara')) retailerName = 'Zara';
    else retailerName = parsed.hostname;
  } catch {
    // Keep fallback
  }

  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const referrer = (req.headers['referer'] as string) || (req.headers['referrer'] as string) || 'direct';

  recordAffiliateClick({
    productId: null,
    retailerName,
    destinationUrl: result.sanitizedUrl,
    clientIp,
    userAgent,
    referrer,
  });

  applyRedirectSecurityHeaders(res);
  res.redirect(302, result.sanitizedUrl);
}
