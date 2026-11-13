import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Tier 2: Backend Security Middleware & Schema Validation', () => {
  describe('Security Headers Enforcement (Helmet)', () => {
    it('sets Content-Security-Policy (CSP) with strict directives', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.headers['content-security-policy']).toBeDefined();
      const csp = res.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
    });

    it('sets X-Frame-Options to DENY to prevent clickjacking', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('sets X-Content-Type-Options to nosniff to prevent MIME type sniffing', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets Referrer-Policy to strict-origin-when-cross-origin', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('omits or masks X-Powered-By header to prevent technology fingerprinting', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS Policy Enforcement', () => {
    it('returns CORS headers for permitted frontend origins', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .set('Origin', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('responds to preflight OPTIONS requests with allowed methods', async () => {
      const res = await request(app)
        .options('/api/v1/products')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Zod Request Validation & Schema Boundaries', () => {
    it('returns 400 Bad Request with structured Zod error when page is non-numeric', async () => {
      const res = await request(app).get('/api/v1/products?page=invalid');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('details');
    });

    it('returns 400 Bad Request when page is less than 1 (negative)', async () => {
      const res = await request(app).get('/api/v1/products?page=-5');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('returns 400 Bad Request when limit exceeds maximum (limit > 48)', async () => {
      const res = await request(app).get('/api/v1/products?limit=100');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('returns 400 Bad Request when sort option is not in allowed enum', async () => {
      const res = await request(app).get('/api/v1/products?sort=unsupported_sort');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/sort|enum/i);
    });

    it('returns 400 Bad Request when minPrice is negative', async () => {
      const res = await request(app).get('/api/v1/products?minPrice=-10');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('Error Handling & Information Leakage Prevention', () => {
    it('returns uniform JSON error structure without exposing stack traces', async () => {
      const res = await request(app).get('/api/v1/products/non_existent_id');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.stack).toBeUndefined();
      expect(res.body).toHaveProperty('message');
    });

    it('returns 404 for arbitrary non-existent routes', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('/api/v1/unknown-endpoint');
    });
  });
});
