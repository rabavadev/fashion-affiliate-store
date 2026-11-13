import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Tier 1: Feature Coverage - Catalog API', () => {
  describe('Default Catalog Retrieval', () => {
    it('returns 200 OK with success status and product array', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.length).toBeLessThanOrEqual(12);
    });

    it('returns valid product schema for each item', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      const product = res.body.data[0];

      expect(product).toHaveProperty('id');
      expect(typeof product.id).toBe('string');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(typeof product.price).toBe('number');
      expect(product.price).toBeGreaterThan(0);
      expect(product).toHaveProperty('currency', 'USD');
      expect(product).toHaveProperty('images');
      expect(product.images).toHaveProperty('primary');
      expect(product.images).toHaveProperty('secondary');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('subcategory');
      expect(product).toHaveProperty('tags');
      expect(Array.isArray(product.tags)).toBe(true);
      expect(product).toHaveProperty('affiliate');
      expect(product.affiliate).toHaveProperty('redirectPath');
      expect(product.affiliate.redirectPath).toMatch(/^\/api\/v1\/redirect\//);
    });

    it('returns pagination metadata with total count, page, and limit', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      const { meta } = res.body;

      expect(meta).toBeDefined();
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(12);
      expect(meta.total).toBeGreaterThanOrEqual(36);
      expect(meta.totalPages).toBeGreaterThanOrEqual(3);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(false);
    });

    it('returns 10 editorial subcategory filter options', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      const subcategories = res.body.filters?.subcategories;

      expect(Array.isArray(subcategories)).toBe(true);
      expect(subcategories.length).toBe(10);

      const keys = subcategories.map((s: { key: string }) => s.key);
      expect(keys).toContain('all');
      expect(keys).toContain('dresses');
      expect(keys).toContain('jumpsuits');
      expect(keys).toContain('party');
      expect(keys).toContain('wedding-guest');
      expect(keys).toContain('office');
      expect(keys).toContain('long');
      expect(keys).toContain('midi');
      expect(keys).toContain('short');
      expect(keys).toContain('knitwear');
    });
  });

  describe('Subcategory Filtering', () => {
    it('filters products strictly by subcategory dresses', async () => {
      const res = await request(app).get('/api/v1/products?subcategory=dresses');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        expect(item.subcategory.toLowerCase()).toBe('dresses');
      }
    });

    it('filters products strictly by subcategory party', async () => {
      const res = await request(app).get('/api/v1/products?subcategory=party');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        expect(item.subcategory.toLowerCase()).toBe('party');
      }
    });

    it('returns all products when subcategory is all', async () => {
      const resAll = await request(app).get('/api/v1/products?subcategory=all');
      const resDefault = await request(app).get('/api/v1/products');
      expect(resAll.status).toBe(200);
      expect(resAll.body.meta.total).toBe(resDefault.body.meta.total);
    });
  });

  describe('Pagination Bounds', () => {
    it('returns page 2 with correct slice and hasPrevPage', async () => {
      const res = await request(app).get('/api/v1/products?page=2&limit=6');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(6);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.limit).toBe(6);
      expect(res.body.meta.hasPrevPage).toBe(true);
    });

    it('clamps limit to maximum of 48', async () => {
      const res = await request(app).get('/api/v1/products?limit=48');
      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(48);
    });
  });

  describe('Price Sorting', () => {
    it('sorts catalog monotonically by price ascending (price-asc)', async () => {
      const res = await request(app).get('/api/v1/products?sort=price-asc&limit=24');
      expect(res.status).toBe(200);
      const items = res.body.data;
      expect(items.length).toBeGreaterThan(1);
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].price).toBeLessThanOrEqual(items[i + 1].price);
      }
    });

    it('sorts catalog monotonically by price descending (price-desc)', async () => {
      const res = await request(app).get('/api/v1/products?sort=price-desc&limit=24');
      expect(res.status).toBe(200);
      const items = res.body.data;
      expect(items.length).toBeGreaterThan(1);
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].price).toBeGreaterThanOrEqual(items[i + 1].price);
      }
    });
  });

  describe('Single Product Detail & Search', () => {
    it('retrieves single product by valid ID (prod_mango_001)', async () => {
      const res = await request(app).get('/api/v1/products/prod_mango_001');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe('prod_mango_001');
      expect(res.body.data.title).toBe('Pleated satin midi dress');
      expect(res.body.data.composition).toBeDefined();
      expect(res.body.data.sizes.length).toBeGreaterThan(0);
    });

    it('returns 404 for non-existent product ID', async () => {
      const res = await request(app).get('/api/v1/products/prod_nonexistent_9999');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('searches products by keyword (e.g. satin)', async () => {
      const res = await request(app).get('/api/v1/products?search=satin');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const matches = res.body.data.some(
        (p: { title: string; description: string }) =>
          p.title.toLowerCase().includes('satin') || p.description.toLowerCase().includes('satin')
      );
      expect(matches).toBe(true);
    });

    it('handles search zero-state gracefully with empty data array and zero total', async () => {
      const res = await request(app).get('/api/v1/products?search=completelyunmatchedterm99999');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('GET /api/v1/categories returns category navigation hierarchy', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
