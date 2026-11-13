import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Tier 3: Concurrency, Load Resilience & Rate Limit Enforcement', () => {
  it('handles 50 parallel requests burst to /api/v1/products with 100% success and intact security headers', async () => {
    const app = createApp();

    const burstRequests = Array.from({ length: 50 }, (_, i) =>
      request(app)
        .get(`/api/v1/products?page=${(i % 3) + 1}&limit=6`)
        .set('Origin', 'http://localhost:5173')
    );

    const responses = await Promise.all(burstRequests);

    expect(responses.length).toBe(50);

    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify security headers remain intact under concurrency
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['content-security-policy']).toBeDefined();
    }
  });

  it('enforces rate limiting under concurrent load of 40 rapid redirect requests (30 succeed, remainder 429)', async () => {
    const app = createApp();
    const validUrl = 'https://shop.mango.com/us/women/dresses';

    // Fire 40 concurrent requests simultaneously
    const redirectRequests = Array.from({ length: 40 }, () =>
      request(app).get(`/api/v1/redirect?url=${encodeURIComponent(validUrl)}`)
    );

    const responses = await Promise.all(redirectRequests);

    const successful = responses.filter((r) => r.status === 302);
    const rateLimited = responses.filter((r) => r.status === 429);

    expect(successful.length).toBe(30);
    expect(rateLimited.length).toBe(10);

    // Verify rate limit response payload
    for (const res of rateLimited) {
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/rate limit exceeded/i);
    }

    // Verify server remains healthy and functional immediately following rate limit exhaustion
    const healthCheck = await request(app).get('/api/v1/products?limit=1');
    expect(healthCheck.status).toBe(200);
    expect(healthCheck.body.status).toBe('success');
  });
});
