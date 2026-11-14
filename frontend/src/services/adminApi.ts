import { Product } from '../types/product.types';

const TOKEN_KEY = 'fashion_crm_token';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface AdminUser {
  id: string;
  username: string;
}

export interface AdminAnalyticsSummary {
  totalProducts: number;
  totalClicks: number;
  activeRetailers: number;
  whitelistedDomains: number;
}

export interface AdminAnalyticsData {
  summary: AdminAnalyticsSummary;
  topProducts: Array<{
    id: string;
    title: string;
    retailer_name: string;
    price: number;
    primary_image: string;
    click_count: number;
  }>;
  clicksByRetailer: Array<{
    retailer_name: string;
    count: number;
  }>;
  recentClicks: Array<{
    id: string;
    product_id: string | null;
    retailer_name: string;
    destination_url: string;
    clicked_at: string;
    product_title?: string;
  }>;
}

export interface WhitelistItem {
  id: string;
  domain: string;
  is_active: number;
  created_at: string;
}

function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
    return `${window.location.origin}${endpoint}`;
  }
  return `http://localhost:4000${endpoint}`;
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser> {
  const res = await fetch(getApiUrl('/api/v1/admin/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Invalid administrative credentials');
  }

  setStoredAdminToken(json.data.token);
  return json.data.admin;
}

export async function checkAdminAuth(): Promise<AdminUser | null> {
  const token = getStoredAdminToken();
  if (!token) return null;

  try {
    const res = await fetch(getApiUrl('/api/v1/admin/auth/me'), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      setStoredAdminToken(null);
      return null;
    }
    const json = await res.json();
    return json.data?.admin || null;
  } catch {
    return null;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(getApiUrl('/api/v1/admin/auth/logout'), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } finally {
    setStoredAdminToken(null);
  }
}

export async function fetchAdminProducts(params?: {
  search?: string;
  subcategory?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: Product[]; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.subcategory && params.subcategory !== 'all') query.set('subcategory', params.subcategory);
  if (typeof params?.inStock === 'boolean') query.set('inStock', String(params.inStock));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const url = getApiUrl(`/api/v1/admin/products${query.toString() ? `?${query.toString()}` : ''}`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json();

  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to fetch admin products');
  }

  return {
    data: json.data || [],
    total: json.meta?.total || 0,
    totalPages: json.meta?.totalPages || 1,
  };
}

export async function createAdminProduct(productData: Record<string, unknown>): Promise<Product> {
  const res = await fetch(getApiUrl('/api/v1/admin/products'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to create product');
  }

  return json.data;
}

export async function updateAdminProduct(id: string, productData: Record<string, unknown>): Promise<Product> {
  const res = await fetch(getApiUrl(`/api/v1/admin/products/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to update product');
  }

  return json.data;
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/v1/admin/products/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to delete product');
  }
}

export async function fetchAdminWhitelist(): Promise<WhitelistItem[]> {
  const res = await fetch(getApiUrl('/api/v1/admin/whitelist'), { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to fetch whitelist');
  }
  return json.data || [];
}

export async function addAdminWhitelistDomain(domain: string): Promise<WhitelistItem> {
  const res = await fetch(getApiUrl('/api/v1/admin/whitelist'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ domain }),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to add domain to whitelist');
  }

  return json.data;
}

export async function deleteAdminWhitelistDomain(id: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/v1/admin/whitelist/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to remove domain from whitelist');
  }
}

export async function fetchAdminAnalytics(): Promise<AdminAnalyticsData> {
  const res = await fetch(getApiUrl('/api/v1/admin/analytics'), { headers: getAuthHeaders() });
  const json = await res.json();
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Failed to fetch analytics');
  }
  return json.data;
}
