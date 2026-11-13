import { test, expect } from '@playwright/test';

// Sample mock data for deterministic browser test runs
const mockProducts = [
  {
    id: 'prod_mango_001',
    slug: 'pleated-satin-midi-dress',
    title: 'Pleated satin midi dress',
    subtitle: 'Editorial Collection',
    category: 'clothing',
    subcategory: 'dresses',
    tags: ['NEW NOW'],
    price: 129.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
      secondary: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_001',
      directTarget: 'https://shop.mango.com/us/women/dresses-midi/pleated-satin-dress_17012345.html',
      partner: 'Rakuten',
    },
  },
  {
    id: 'prod_mango_002',
    slug: 'velvet-cocktail-dress',
    title: 'Velvet cocktail dress',
    subtitle: 'Party Collection',
    category: 'clothing',
    subcategory: 'party',
    tags: ['PARTY'],
    price: 179.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500',
      secondary: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_002',
      directTarget: 'https://shop.mango.com/us/women/party/velvet-cocktail-dress_17099999.html',
      partner: 'Rakuten',
    },
  },
  {
    id: 'prod_mango_003',
    slug: 'wool-structured-coat',
    title: 'Wool structured coat',
    subtitle: 'Office Winter',
    category: 'clothing',
    subcategory: 'office',
    tags: ['OFFICE'],
    price: 249.99,
    currency: 'USD',
    images: {
      primary: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
      secondary: 'https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?w=500',
    },
    affiliate: {
      redirectPath: '/api/v1/redirect/prod_mango_003',
      directTarget: 'https://shop.mango.com/us/women/coats/wool-coat_17088888.html',
      partner: 'Rakuten',
    },
  },
];

test.describe('Tier 4: Editorial Affiliate Store End-to-End User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept catalog API requests to ensure test determinism
    await page.route('**/api/v1/products*', async (route) => {
      const url = new URL(route.request().url());
      const subcategory = url.searchParams.get('subcategory');

      let filtered = mockProducts;
      if (subcategory && subcategory.toLowerCase() !== 'all') {
        filtered = mockProducts.filter(
          (p) => p.subcategory.toLowerCase() === subcategory.toLowerCase()
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: filtered,
          meta: {
            total: filtered.length,
            page: 1,
            limit: 36,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        }),
      });
    });

    // Intercept affiliate redirection endpoint (both Mode A: ID and Mode B: target URL)
    await page.route('**/api/v1/redirect*', async (route) => {
      const url = new URL(route.request().url());
      const targetQueryUrl = url.searchParams.get('url');

      if (targetQueryUrl) {
        try {
          const parsed = new URL(targetQueryUrl);
          const host = parsed.hostname.toLowerCase();
          const isAllowed = host === 'shop.mango.com' || host === 'mango.com' || host.endsWith('.mango.com');
          if (parsed.protocol === 'https:' && isAllowed && !host.includes('attacker') && !host.includes('evil')) {
            await route.fulfill({
              status: 302,
              headers: {
                Location: `${targetQueryUrl}${targetQueryUrl.includes('?') ? '&' : '?'}utm_source=fashion_affiliate&utm_medium=referral`,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options': 'nosniff',
              },
            });
            return;
          }
        } catch {
          // Fall through to 403
        }

        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Destination domain not in allowed whitelist' }),
        });
        return;
      }

      const pathParts = url.pathname.split('/');
      const productId = pathParts[pathParts.length - 1];

      const product = mockProducts.find((p) => p.id === productId);
      if (product) {
        await route.fulfill({
          status: 302,
          headers: {
            Location: `${product.affiliate.directTarget}?utm_source=fashion_affiliate&utm_medium=referral`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Product not found' }),
        });
      }
    });
  });

  test('Scenario 1: Complete customer journey (browse, filter, view switch, hover, wishlist, redirect)', async ({ page }) => {
    // 1. Open storefront
    await page.goto('/');

    // Verify editorial header branding and navigation
    await expect(page.getByLabel('MANGO Home')).toBeVisible();
    await expect(page.getByRole('button', { name: 'COLLECTION', exact: true })).toBeVisible();

    // 2. Initial Catalog Display
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(3);
    await expect(page.getByText('Pleated satin midi dress')).toBeVisible();

    // 3. Subcategory Filter: Click PARTY filter
    const partyFilter = page.locator('[data-testid="filter-party"]');
    await partyFilter.click();
    await expect(partyFilter).toHaveClass(/active|font-semibold/);

    // Verify filtered catalog shows only party product
    await expect(cards).toHaveCount(1);
    await expect(page.getByText('Velvet cocktail dress')).toBeVisible();
    await expect(page.getByText('Pleated satin midi dress')).not.toBeVisible();

    // 4. Grid View Switcher: Click VIEW 2 button
    const view2Btn = page.locator('[data-testid="view-2-btn"]');
    await view2Btn.click();
    const productGrid = page.locator('[data-testid="product-grid"]');
    await expect(productGrid).toHaveClass(/sm:grid-cols-2/);

    // 5. Dual-Image Hover Swap on Product Card
    const firstCard = cards.first();
    const cardImage = firstCard.locator('img').first();
    const initialSrc = await cardImage.getAttribute('src');
    expect(initialSrc).toContain('photo-1539109136881-3be0616acf4b');

    // Hover over product card
    await firstCard.hover();
    await page.waitForTimeout(150);
    const hoveredSrc = await cardImage.getAttribute('src');
    expect(hoveredSrc).toContain('photo-1566174053879-31528523f8ae');

    // 6. Wishlist Toggle and LocalStorage Persistence
    const cardWishlistBtn = firstCard.locator('[data-testid="wishlist-toggle"]');
    await cardWishlistBtn.click();

    // Verify Header Wishlist counter badge increments to 1
    const badge = page.locator('[data-testid="wishlist-count"]');
    await expect(badge).toHaveText('1');

    // Reload page to test localStorage persistence
    await page.reload();
    await expect(page.locator('[data-testid="wishlist-count"]')).toHaveText('1');

    // 7. Open Wishlist Drawer and Verify Outbound Affiliate Redirect
    const headerWishlistBtn = page.locator('header [data-testid="wishlist-toggle"]');
    await headerWishlistBtn.click();

    const drawer = page.locator('[data-testid="wishlist-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Velvet cocktail dress')).toBeVisible();

    // Click outbound affiliate link from inside drawer
    const affiliateLink = drawer.locator('[data-testid="drawer-affiliate-link"]');
    const href = await affiliateLink.getAttribute('href');
    expect(href).toMatch(/\/api\/v1\/redirect\/prod_mango_002/);

    // Verify server redirect HTTP 302 with Location header pointing to whitelisted domain
    const response = await page.request.get(href!, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    const location = response.headers()['location'];
    expect(location).toContain('shop.mango.com');
    expect(location).toContain('utm_source=fashion_affiliate');
  });

  test('Scenario 2: Empty search / zero-state handling', async ({ page }) => {
    // Intercept empty response for non-existent category
    await page.route('**/api/v1/products?subcategory=wedding-guest*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [], meta: { total: 0 } }),
      });
    });

    await page.goto('/');
    const filterBtn = page.locator('[data-testid="filter-wedding-guest"]');
    await filterBtn.click();

    const emptyState = page.locator('[data-testid="product-grid-empty"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/No garments found/i);

    // Clear filter by clicking ALL
    await page.locator('[data-testid="filter-all"]').click();
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3);
  });

  test('Scenario 3: Responsive Viewport Adaptation (Mobile 375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByLabel('MANGO Home')).toBeVisible();
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible();

    // Verify horizontal scrolling does not break layout (no page overflow)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowance for scrollbar
  });

  test('Scenario 4: Malicious Outbound Redirect Link Click Defense', async ({ page }) => {
    await page.goto('/');

    const attackUrl = '/api/v1/redirect?url=' + encodeURIComponent('https://shop.mango.com.evilattacker.com/phish');
    const response = await page.request.get(attackUrl);
    expect([400, 403]).toContain(response.status());
  });

  test('Scenario 5: Wishlist Multi-Item Persistence & Removal', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('[data-testid="product-card"]');
    // Save first item
    await cards.nth(0).locator('[data-testid="wishlist-toggle"]').click();
    // Save second item
    await cards.nth(1).locator('[data-testid="wishlist-toggle"]').click();

    const badge = page.locator('[data-testid="wishlist-count"]');
    await expect(badge).toHaveText('2');

    // Open drawer
    await page.locator('header [data-testid="wishlist-toggle"]').click();
    const drawer = page.locator('[data-testid="wishlist-drawer"]');
    await expect(drawer.getByText('2 items saved')).toBeVisible();

    // Remove one item
    await drawer.locator('[data-testid^="remove-"]').first().click();
    await expect(drawer.getByText('1 item saved')).toBeVisible();
    await expect(badge).toHaveText('1');

    // Reload page and verify 1 item remains in state
    await page.reload();
    await expect(page.locator('[data-testid="wishlist-count"]')).toHaveText('1');
  });
});
