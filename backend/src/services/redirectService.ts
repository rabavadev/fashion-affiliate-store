import { isDomainWhitelisted } from '../config/whitelist';
import { getProductById } from './catalogService';

export interface ValidationSuccess {
  valid: true;
  sanitizedUrl: string;
}

export interface ValidationFailure {
  valid: false;
  status: 400 | 403 | 404;
  message: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

// Regex to detect IPv4 addresses
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Validates and sanitizes an outbound target URL against strict security criteria:
 * 1. Type and format validation.
 * 2. CRLF & control character rejection.
 * 3. Strict URL constructor parsing.
 * 4. HTTPS protocol enforcement.
 * 5. Userinfo / credentials rejection (@ spoofing).
 * 6. SSRF / IP / Loopback blocking (127.0.0.1, 169.254.169.254, [::1], localhost, etc.).
 * 7. Port 443 / default enforcement.
 * 8. Domain whitelist matching (exact or strict subdomain dot-boundary).
 * 9. Parameter sanitization and safe UTM injection.
 */
export function validateTargetUrl(rawUrl: unknown): ValidationResult {
  // Step 1: Type & Format Guard
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      valid: false,
      status: 400,
      message: 'Target URL must be a non-empty string',
    };
  }

  const trimmed = rawUrl.trim();

  // Step 2: CRLF & Control Character Sanitize
  if (/[\r\n\0]/.test(trimmed) || /%0[ad0]/i.test(trimmed)) {
    return {
      valid: false,
      status: 400,
      message: 'URL contains illegal control characters or CRLF injection',
    };
  }

  // Reject protocol-relative URLs (e.g. //attacker.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return {
      valid: false,
      status: 400,
      message: 'Protocol-relative URLs are not allowed',
    };
  }

  // Reject backslash in authority/host (e.g. shop.mango.com\@attacker.com)
  if (trimmed.includes('\\')) {
    return {
      valid: false,
      status: 400,
      message: 'Backslash characters are not allowed in target URL',
    };
  }

  // Step 3: Strict URL Constructor Parsing
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      status: 400,
      message: 'Invalid URL format',
    };
  }

  // Step 4: Protocol Check (Scheme must strictly be https:)
  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      status: 400,
      message: 'Only HTTPS destinations are allowed',
    };
  }

  // Step 5: Credentials Check
  if (parsed.username !== '' || parsed.password !== '') {
    return {
      valid: false,
      status: 400,
      message: 'Userinfo credentials in destination URL are not allowed',
    };
  }

  // Also check raw string for userinfo '@' symbol in the authority segment
  const authorityEnd = trimmed.indexOf('/', parsed.protocol.length + 2);
  const authorityPart = authorityEnd === -1 ? trimmed : trimmed.substring(0, authorityEnd);
  if (authorityPart.includes('@')) {
    return {
      valid: false,
      status: 400,
      message: 'Userinfo impersonation (@) is not allowed',
    };
  }

  // Step 6: IP Address / SSRF / Loopback Block
  const hostname = parsed.hostname.toLowerCase();

  // Localhost check
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return {
      valid: false,
      status: 403,
      message: 'Loopback and localhost destinations are prohibited',
    };
  }

  // IPv4 check
  if (IPV4_REGEX.test(hostname)) {
    return {
      valid: false,
      status: 403,
      message: 'Direct IP destinations are prohibited',
    };
  }

  // IPv6 check
  if (hostname.includes(':') || (hostname.startsWith('[') && hostname.endsWith(']'))) {
    return {
      valid: false,
      status: 403,
      message: 'IPv6 destinations are prohibited',
    };
  }

  // Step 7: Port Check
  if (parsed.port !== '' && parsed.port !== '443') {
    return {
      valid: false,
      status: 400,
      message: `Non-standard port "${parsed.port}" is not allowed`,
    };
  }

  // Step 8: Domain Whitelist Check
  if (!isDomainWhitelisted(hostname)) {
    return {
      valid: false,
      status: 403,
      message: `Destination domain "${hostname}" is not in the allowed whitelist`,
    };
  }

  // Step 9: Parameter Sanitization & UTM Injection
  // Sanitize any existing params
  for (const [key, value] of parsed.searchParams.entries()) {
    if (/[\r\n\0]/.test(key) || /[\r\n\0]/.test(value)) {
      parsed.searchParams.delete(key);
    }
  }

  // Inject standard affiliate tracking parameters
  parsed.searchParams.set('utm_source', 'fashion_affiliate');
  parsed.searchParams.set('utm_medium', 'referral');

  return {
    valid: true,
    sanitizedUrl: parsed.toString(),
  };
}

/**
 * Resolves a redirect destination for a given product ID (Mode A).
 * Guarantees zero-trust outbound redirection by sourcing URLs directly from verified catalog data.
 */
export function resolveProductRedirect(productId: string): ValidationResult {
  if (!productId || typeof productId !== 'string') {
    return {
      valid: false,
      status: 400,
      message: 'Invalid product ID',
    };
  }

  const product = getProductById(productId);
  if (!product) {
    return {
      valid: false,
      status: 404,
      message: `Product with ID "${productId}" not found`,
    };
  }

  const targetUrl = product.affiliate?.directTarget;
  if (!targetUrl) {
    return {
      valid: false,
      status: 404,
      message: `No affiliate redirect destination configured for product "${productId}"`,
    };
  }

  return validateTargetUrl(targetUrl);
}
