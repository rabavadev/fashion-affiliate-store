import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Tier 1: Feature Coverage - Affiliate Outbound Redirection (Happy Path)', () => {
  describe('Mode A: Product ID-Based Outbound Redirection', () => {
    it('redirects with HTTP 302 for valid existing product ID (prod_mango_001)', async () => {
      const res = await request(app).get('/api/v1/redirect/prod_mango_001');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBeDefined();
      expect(res.headers.location).toContain('https://shop.mango.com/');
    });

    it('injects standard affiliate tracking parameters into product destination URL', async () => {
      const res = await request(app).get('/api/v1/redirect/prod_mango_001');
      expect(res.status).toBe(302);
      const location = new URL(res.headers.location);
      expect(location.searchParams.get('utm_source')).toBe('fashion_affiliate');
      expect(location.searchParams.get('utm_medium')).toBe('referral');
    });

    it('enforces strict cache-control no-store headers on redirection responses', async () => {
      const res = await request(app).get('/api/v1/redirect/prod_mango_001');
      expect(res.status).toBe(302);
      const cacheControl = res.headers['cache-control'];
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('no-cache');
    });

    it('sets security headers on redirect responses', async () => {
      const res = await request(app).get('/api/v1/redirect/prod_mango_001');
      expect(res.status).toBe(302);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('returns 404 Not Found for non-existent product ID', async () => {
      const res = await request(app).get('/api/v1/redirect/prod_unknown_9999');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('not found');
    });
  });

  describe('Mode B: Whitelisted Target URL Outbound Redirection', () => {
    it('redirects with HTTP 302 for verified retailer URL (shop.mango.com)', async () => {
      const targetUrl = 'https://shop.mango.com/us/women/dresses/linen-midi-dress_123.html';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(targetUrl)}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://shop.mango.com/us/women/dresses/linen-midi-dress_123.html');
      expect(res.headers.location).toContain('utm_source=fashion_affiliate');
    });

    it('redirects for verified subdomain (shop.nordstrom.com)', async () => {
      const targetUrl = 'https://shop.nordstrom.com/s/cocktail-dress/123456';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(targetUrl)}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://shop.nordstrom.com/');
    });

    it('redirects for verified affiliate network URL (rstyle.me)', async () => {
      const targetUrl = 'https://rstyle.me/+item12345';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(targetUrl)}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://rstyle.me/');
    });

    it('preserves existing legitimate product query params while adding tracking', async () => {
      const targetUrl = 'https://shop.mango.com/us/item?color=black&size=M';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(targetUrl)}`);
      expect(res.status).toBe(302);
      const location = new URL(res.headers.location);
      expect(location.searchParams.get('color')).toBe('black');
      expect(location.searchParams.get('size')).toBe('M');
      expect(location.searchParams.get('utm_source')).toBe('fashion_affiliate');
      expect(location.searchParams.get('utm_medium')).toBe('referral');
    });
  });
});
