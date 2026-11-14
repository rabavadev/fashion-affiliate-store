/**
 * Secure domain whitelist for affiliate outbound links.
 * Any outbound redirect MUST match either the exact domain or a strict subdomain dot-boundary.
 * Backed by SQLite persistent whitelist_domains table with dynamic CRM additions.
 */

import { getDb } from '../db/connection';

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

export interface WhitelistDomainRecord {
  id: string;
  domain: string;
  is_active: number;
  created_at: string;
}

/**
 * Returns active whitelisted domains from SQLite.
 */
export function getActiveWhitelistedDomains(): string[] {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT domain FROM whitelist_domains WHERE is_active = 1').all() as { domain: string }[];
    if (rows && rows.length > 0) {
      return rows.map((r) => r.domain.toLowerCase());
    }
  } catch {
    // Fallback to static list if database is not yet ready
  }
  return ALLOWED_DOMAINS.map((d) => d.toLowerCase());
}

/**
 * Checks whether a given hostname is whitelisted.
 * Matches:
 * 1. Exact host match: hostname === domain
 * 2. Strict subdomain match: hostname.endsWith('.' + domain)
 *
 * Prevents substring spoofing such as shop.mango.com.attacker.com.
 */
export function isDomainWhitelisted(hostname: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  const allowed = getActiveWhitelistedDomains();

  return allowed.some((allowedDomain) => {
    const normalizedAllowed = allowedDomain.toLowerCase();
    return (
      normalizedHost === normalizedAllowed ||
      normalizedHost.endsWith(`.${normalizedAllowed}`)
    );
  });
}
