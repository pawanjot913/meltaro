/**
 * API Client — Meltaro Artisan Bakery & Café
 * -------------------------------------------
 * Token storage strategy:
 *
 *   ACCESS TOKEN  → stored in module-level memory (a plain variable).
 *     Never written to localStorage or sessionStorage, so it can't be
 *     stolen by XSS. Lost on page refresh — that's intentional; the
 *     silent refresh flow below handles re-acquiring it from the cookie.
 *
 *   REFRESH TOKEN → stored in an httpOnly cookie set by the server.
 *     JavaScript cannot read it at all. Sent automatically by the
 *     browser only to /api/auth/* endpoints (cookie path restriction).
 *
 * Flow on page load:
 *   1. No access token in memory (page was refreshed).
 *   2. Any protected request → 401 "Access token expired" response.
 *   3. request() catches the 401, calls /api/auth/refresh.
 *   4. Server reads httpOnly cookie, returns a new access token.
 *   5. Token stored in memory, original request retried once.
 *   6. If refresh also fails → admin is redirected to login.
 */

import {
  MenuItem,
  Review,
  Category,
  SiteContent,
  CartItem,
  CreateOrderPayload,
  CreateOrderResponse,
  ContactMessagePayload,
  NewsletterPayload,
} from './types';
import { MENU_ITEMS, REVIEWS, CATEGORIES, SITE_CONTENT } from './mockData';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

// ── In-memory token store ─────────────────────────────────────────────
// Module-level variable — exists for the lifetime of the page, lost on
// refresh (by design). No localStorage, no sessionStorage.
let _accessToken: string | null = null;
let _isRefreshing = false;
// Queue of resolve/reject callbacks waiting for a refresh in progress
let _refreshQueue: Array<(token: string | null) => void> = [];

export function setAccessToken(token: string): void { _accessToken = token; }
export function clearAccessToken(): void { _accessToken = null; }
export function getAccessToken(): string | null { return _accessToken; }

// ── Custom error class ────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────
async function request<T>(
  path: string,
  options?: RequestInit,
  opts?: { auth?: boolean; customerToken?: string; _isRetry?: boolean }
): Promise<T> {
  const extraHeaders =
    options?.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
      ? (options.headers as Record<string, string>)
      : {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  // Customer Supabase token takes precedence for order routes; admin in-memory token is separate
  if (opts?.customerToken) {
    headers.Authorization = `Bearer ${opts.customerToken}`;
  } else if (opts?.auth && _accessToken) {
    headers.Authorization = `Bearer ${_accessToken}`;
  }

  const { headers: _h, ...rest } = options ?? {};

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // send httpOnly refresh cookie on /api/auth/* calls
    headers,
    ...rest,
  });

  // Auto-refresh on 401 — but only once per request (no infinite loops)
  // Only applies to admin auth flows, never customer Supabase tokens.
  if (res.status === 401 && opts?.auth && !opts._isRetry) {
    const newToken = await silentRefresh();
    if (newToken) {
      // Retry the original request with the new token
      return request<T>(path, options, { auth: true, _isRetry: true });
    }
    // Refresh also failed — clear state and let the UI handle it
    clearAccessToken();
    throw new ApiError('Session expired — please log in again', 401);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let details: unknown;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      if (body?.details) details = body.details;
    } catch { /* response wasn't JSON */ }
    throw new ApiError(message, res.status, details);
  }

  return res.json() as Promise<T>;
}

/**
 * Calls /api/auth/refresh using the httpOnly cookie.
 * Queues concurrent callers so only one refresh request is in flight
 * at a time — avoids a flood of parallel refresh calls when many
 * requests expire at the same moment.
 */
async function silentRefresh(): Promise<string | null> {
  if (_isRefreshing) {
    // Someone else is already refreshing — wait for their result
    return new Promise((resolve) => { _refreshQueue.push(resolve); });
  }

  _isRefreshing = true;
  try {
    const data = await request<{ accessToken: string }>(
      '/auth/refresh',
      { method: 'POST' },
      { _isRetry: true } // prevent infinite loop if refresh 401s
    );
    _accessToken = data.accessToken;
    _refreshQueue.forEach((cb) => cb(data.accessToken));
    return data.accessToken;
  } catch {
    _accessToken = null;
    _refreshQueue.forEach((cb) => cb(null));
    return null;
  } finally {
    _isRefreshing = false;
    _refreshQueue = [];
  }
}

// ── Public API functions ──────────────────────────────────────────────

export async function fetchMenuItems(): Promise<MenuItem[]> {
  try { return await request<MenuItem[]>('/menu'); }
  catch (err) { console.warn('fetchMenuItems: using mock fallback', err); return MENU_ITEMS; }
}

export async function fetchCategories(): Promise<Category[]> {
  try { return await request<Category[]>('/categories'); }
  catch (err) { console.warn('fetchCategories: using mock fallback', err); return CATEGORIES; }
}

export async function fetchReviews(): Promise<Review[]> {
  try { return await request<Review[]>('/reviews'); }
  catch (err) { console.warn('fetchReviews: using mock fallback', err); return REVIEWS; }
}

export async function fetchSiteContent(): Promise<SiteContent> {
  try { return await request<SiteContent>('/content'); }
  catch (err) { console.warn('fetchSiteContent: using mock fallback', err); return SITE_CONTENT; }
}

export async function submitOrder(
  cartItems: CartItem[],
  details: {
    fullName: string;
    phone: string;
    address: string;
    vehicleLicense?: string;
    mode: CreateOrderPayload['mode'];
  },
  accessToken: string
): Promise<CreateOrderResponse> {
  if (!accessToken) {
    throw new ApiError('Sign in required to place an order', 401);
  }

  return request<CreateOrderResponse>(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        ...details,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
        })),
      }),
    },
    { customerToken: accessToken }
  );
}

export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function subscribeNewsletter(
  payload: NewsletterPayload
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/newsletter', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendChatMessage(
  message: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<{ reply: string; source: string }> {
  return request<{ reply: string; source: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}

// ── Admin API functions (require valid access token) ──────────────────

export async function adminLogin(
  email: string,
  password: string
): Promise<{ accessToken: string; admin: { email: string; name: string } }> {
  const result = await request<{
    accessToken: string;
    expiresIn: number;
    admin: { email: string; name: string };
  }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setAccessToken(result.accessToken);
  return result;
}

export async function adminLogout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' }).catch(() => {});
  clearAccessToken();
}

export async function fetchAllOrders(): Promise<CreateOrderResponse[]> {
  return request<CreateOrderResponse[]>('/admin/orders', undefined, { auth: true });
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>(
    `/admin/orders/${orderId}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    { auth: true }
  );
}

export async function createMenuItem(
  item: Omit<MenuItem, 'id'> & { id: string }
): Promise<MenuItem> {
  return request<MenuItem>(
    '/admin/menu',
    { method: 'POST', body: JSON.stringify(item) },
    { auth: true }
  );
}

export async function updateMenuItem(
  id: string,
  item: Partial<MenuItem>
): Promise<MenuItem> {
  return request<MenuItem>(
    `/admin/menu/${id}`,
    { method: 'PUT', body: JSON.stringify(item) },
    { auth: true }
  );
}

export async function deleteMenuItem(
  id: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    `/admin/menu/${id}`,
    { method: 'DELETE' },
    { auth: true }
  );
}
