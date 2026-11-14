import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Admin & CRM Platform Test Suite', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Authenticate using the seeded admin credentials
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        username: 'admin',
        password: 'AdminPassword123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.status).toBe('success');
    expect(loginRes.body.data.token).toBeDefined();
    adminToken = loginRes.body.data.token;
  });

  describe('Administrative Authentication', () => {
    it('authenticates admin with valid credentials and issues JWT and cookie', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({
          username: 'admin',
          password: 'AdminPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.admin.username).toBe('admin');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('rejects authentication with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({
          username: 'admin',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('verifies active session via /api/v1/admin/auth/me with Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.admin.username).toBe('admin');
    });

    it('blocks access to protected CRM endpoints without valid token', async () => {
      const res = await request(app).get('/api/v1/admin/products');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('clears session on logout', async () => {
      const res = await request(app).post('/api/v1/admin/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('Product Catalog CRM CRUD Operations', () => {
    let createdProductId: string;

    it('lists products for admin with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/admin/products?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(30);
    });

    it('creates a new product with Zod validation and stores in SQLite', async () => {
      const newProductPayload = {
        title: 'Silk Organza Trench Coat',
        subtitle: 'Limited Runway Edit',
        category: 'clothing',
        subcategory: 'office',
        tags: ['RUNWAY', 'NEW ARRIVAL'],
        price: 349.99,
        originalPrice: 420.0,
        currency: 'USD',
        primaryImage: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
        secondaryImage: 'https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?w=500',
        retailerName: 'MANGO',
        affiliateUrl: 'https://shop.mango.com/us/women/coats/silk-trench_99999.html',
        description: 'Delicate pure silk organza structured luxury trench.',
        composition: '100% Mulberry Silk',
        inStock: true,
      };

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProductPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Silk Organza Trench Coat');
      expect(res.body.data.price).toBe(349.99);

      createdProductId = res.body.data.id;
    });

    it('immediately reflects created product in public storefront catalog API', async () => {
      const res = await request(app).get('/api/v1/products?search=Silk Organza');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((p: { id: string }) => p.id === createdProductId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Silk Organza Trench Coat');
    });

    it('updates product pricing and stock status via CRM', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 299.99,
          inStock: false,
          subtitle: 'Winter Archive Sale',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.price).toBe(299.99);
      expect(res.body.data.inStock).toBe(false);

      // Verify immediate reflection on public endpoint
      const publicRes = await request(app).get(`/api/v1/products/${createdProductId}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.price).toBe(299.99);
      expect(publicRes.body.data.inStock).toBe(false);
    });

    it('deletes product from CRM and removes it from public catalog', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify 404 in public API
      const publicRes = await request(app).get(`/api/v1/products/${createdProductId}`);
      expect(publicRes.status).toBe(404);
    });
  });

  describe('Dynamic Whitelist CRM Management', () => {
    let newDomainId: string;
    const testDomain = 'curated-luxury-boutique.com';

    it('lists current whitelisted domains', async () => {
      const res = await request(app)
        .get('/api/v1/admin/whitelist')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('adds a new approved retailer domain to SQLite whitelist', async () => {
      const res = await request(app)
        .post('/api/v1/admin/whitelist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ domain: testDomain });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.domain).toBe(testDomain);
      newDomainId = res.body.data.id;
    });

    it('allows outbound redirect to newly whitelisted domain immediately', async () => {
      const targetUrl = `https://${testDomain}/collection/dresses?item=123`;
      const res = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(targetUrl)}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain(`https://${testDomain}/collection/dresses`);
    });

    it('removes domain from whitelist and immediately blocks redirection', async () => {
      const resDel = await request(app)
        .delete(`/api/v1/admin/whitelist/${newDomainId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resDel.status).toBe(200);

      // Now outbound redirect to testDomain must be rejected (403 Forbidden)
      const targetUrl = `https://${testDomain}/collection/dresses?item=123`;
      const resBlocked = await request(app).get(`/api/v1/redirect?url=${encodeURIComponent(targetUrl)}`);

      expect(resBlocked.status).toBe(403);
      expect(resBlocked.body.status).toBe('error');
    });
  });

  describe('Affiliate Analytics & Click Stream CRM Tracking', () => {
    it('records outbound click stream and aggregates metrics in /api/v1/admin/analytics', async () => {
      // Trigger an outbound product redirect
      await request(app)
        .get('/api/v1/redirect/prod_mango_001')
        .set('User-Agent', 'Mozilla/5.0 Test Suite')
        .set('Referer', 'https://fashion-store.example.com');

      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const { summary, topProducts, clicksByRetailer, recentClicks } = res.body.data;
      expect(summary.totalClicks).toBeGreaterThanOrEqual(1);
      expect(summary.totalProducts).toBeGreaterThanOrEqual(30);
      expect(Array.isArray(clicksByRetailer)).toBe(true);
      expect(Array.isArray(recentClicks)).toBe(true);
      expect(recentClicks.length).toBeGreaterThanOrEqual(1);

      const latestClick = recentClicks[0];
      expect(latestClick.product_id).toBe('prod_mango_001');
      expect(latestClick.retailer_name).toBe('MANGO');
      expect(latestClick.destination_url).toContain('https://shop.mango.com');
    });
  });
});
