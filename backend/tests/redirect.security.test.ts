import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app, { createApp } from '../src/app';

describe('Tier 2: Outbound Affiliate Redirect Security & Whitelist Engine', () => {
  describe('Domain Whitelist & Open Redirect Vulnerability Attacks (CWE-601)', () => {
    it('blocks substring domain spoofing (shop.mango.com.attacker.com)', async () => {
      const evilUrl = 'https://shop.mango.com.attacker.com/steal-creds';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks prefix domain spoofing (evilmango.com)', async () => {
      const evilUrl = 'https://evilmango.com/phishing';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks query parameter domain confusion (attacker.com?shop.mango.com)', async () => {
      const evilUrl = 'https://attacker.com?trusted=shop.mango.com';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks URL fragment domain confusion (attacker.com#shop.mango.com)', async () => {
      const evilUrl = 'https://attacker.com#shop.mango.com';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks username/password (@) host impersonation', async () => {
      const evilUrl = 'https://shop.mango.com@attacker.com/login';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks backslash host bypass (shop.mango.com\\@attacker.com)', async () => {
      const evilUrl = 'https://shop.mango.com\\@attacker.com';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks protocol-relative URLs (//attacker.com)', async () => {
      const evilUrl = '//attacker.com/exploit';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(evilUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks insecure HTTP scheme (http://shop.mango.com/product)', async () => {
      const httpUrl = 'http://shop.mango.com/product';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(httpUrl)}`);
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('blocks javascript: pseudo-protocol (XSS injection)', async () => {
      const xssUrl = 'javascript:alert(document.cookie)';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(xssUrl)}`);
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('blocks data: URI scheme (HTML/JS payload)', async () => {
      const dataUrl = 'data:text/html,<script>alert(1)</script>';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(dataUrl)}`);
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('blocks file: URI scheme', async () => {
      const fileUrl = 'file:///C:/Windows/win.ini';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(fileUrl)}`);
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('blocks vbscript: URI scheme', async () => {
      const vbsUrl = 'vbscript:msgbox(1)';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(vbsUrl)}`);
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('blocks non-standard port evasion (https://shop.mango.com:8080/admin)', async () => {
      const portUrl = 'https://shop.mango.com:8080/admin';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(portUrl)}`);
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('SSRF & Internal Network Address Protection (CWE-918)', () => {
    it('blocks IPv4 loopback (127.0.0.1)', async () => {
      const res = await request(app).get(
        `/api/v1/redirect?url=${encodeURIComponent('https://127.0.0.1:443/admin')}`
      );
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks AWS/Cloud metadata service IP (169.254.169.254)', async () => {
      const res = await request(app).get(
        `/api/v1/redirect?url=${encodeURIComponent('https://169.254.169.254/latest/meta-data/')}`
      );
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks localhost hostname', async () => {
      const res = await request(app).get(
        `/api/v1/redirect?url=${encodeURIComponent('https://localhost/internal')}`
      );
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks 0.0.0.0 wildcard address', async () => {
      const res = await request(app).get(
        `/api/v1/redirect?url=${encodeURIComponent('https://0.0.0.0/internal')}`
      );
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('blocks IPv6 loopback ([::1])', async () => {
      const res = await request(app).get(
        `/api/v1/redirect?url=${encodeURIComponent('https://[::1]/internal')}`
      );
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });
  });

  describe('CRLF Header Injection Protection (CWE-113)', () => {
    it('rejects URLs containing carriage return (%0d) and newline (%0a)', async () => {
      const crlfUrl = 'https://shop.mango.com/us/%0d%0aSet-Cookie:%20session=hacked';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(crlfUrl)}`);
      expect([400, 403]).toContain(res.status);
      expect(res.body.status).toBe('error');
    });

    it('rejects URLs containing raw newline characters', async () => {
      const rawCrlfUrl = 'https://shop.mango.com/us/\r\nSet-Cookie:admin=true';
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(rawCrlfUrl)}`);
      expect([400, 403]).toContain(res.status);
    });
  });

  describe('Input Validation & Parameter Boundaries', () => {
    it('returns 400 Bad Request when url parameter is missing', async () => {
      const res = await request(app).get('/api/v1/redirect');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('url');
    });

    it('returns 400 Bad Request when url parameter is empty string', async () => {
      const res = await request(app).get('/api/v1/redirect?url=');
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('handles HTTP Parameter Pollution (duplicate url params)', async () => {
      const res = await request(app).get(
        '/api/v1/redirect?url=https://shop.mango.com/valid&url=https://evilattacker.com/malicious'
      );
      // HPP clamps to first/last string or Zod rejects array -> safe either way
      if (res.status === 302) {
        expect(res.headers.location).toContain('shop.mango.com');
      } else {
        expect([400, 403]).toContain(res.status);
      }
    });
  });

  describe('Rate Limiting Boundary', () => {
    it('enforces 30 requests/minute on outbound redirect endpoint (31st returns 429)', async () => {
      const isolatedApp = createApp();
      const validUrl = 'https://shop.mango.com/us/women';

      const requests = Array.from({ length: 32 }, () =>
        request(isolatedApp).get(`/api/v1/redirect?url=${encodeURIComponent(validUrl)}`)
      );

      const responses = await Promise.all(requests);
      const successful = responses.filter((r) => r.status === 302);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(successful.length).toBeLessThanOrEqual(30);
      expect(rateLimited.length).toBeGreaterThanOrEqual(1);

      const rateLimitResponse = rateLimited[0];
      expect(rateLimitResponse.body.status).toBe('error');
      expect(rateLimitResponse.body.message).toMatch(/rate limit exceeded/i);
    });
  });
});
