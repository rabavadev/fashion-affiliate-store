/**
 * Secure domain whitelist for affiliate outbound links.
 * Any outbound redirect MUST match either the exact domain or a strict subdomain dot-boundary.
 */

export const ALLOWED_RETAILER_DOMAINS = [
  'shop.mango.com',
  'mango.com',
  'nordstrom.com',
  'shop.nordstrom.com',
  'net-a-porter.com',
  'asos.com',
  'farfetch.com',
  'revolve.com',
  'zara.com',
] as const;

export const ALLOWED_AFFILIATE_DOMAINS = [
  'click.linksynergy.com',
  'www.tkqlhce.com',
  'www.anrdoezrs.net',
  'www.jdoqocy.com',
  'awin1.com',
  'rstyle.me',
  'shopstyle.com',
  'imp.i384100.net',
] as const;

export const ALLOWED_DOMAINS: readonly string[] = [
  ...ALLOWED_RETAILER_DOMAINS,
  ...ALLOWED_AFFILIATE_DOMAINS,
];

/**
 * Checks whether a given hostname is whitelisted.
 * Matches:
 * 1. Exact host match: `hostname === domain`
 * 2. Strict subdomain match: `hostname.endsWith('.' + domain)`
 *
 * Prevents substring spoofing such as `shop.mango.com.attacker.com`.
 */
export function isDomainWhitelisted(hostname: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();

  return ALLOWED_DOMAINS.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase();
    return (
      normalizedHost === normalizedAllowed ||
      normalizedHost.endsWith(`.${normalizedAllowed}`)
    );
  });
}
