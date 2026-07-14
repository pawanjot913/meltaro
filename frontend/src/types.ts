/**
 * Shared Type Definitions for Meltaro Artisan Bakery & Café
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  isPopular?: boolean;
  ingredients?: string[];
  tags?: string[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

/** Flat line item returned by the orders API (price snapshotted at order time). */
export interface OrderLineItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderMode = 'pickup' | 'delivery' | 'carhop';

export interface Review {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export interface OrderDetails {
  orderId?: string;
  fullName: string;
  phone: string;
  address: string;
  vehicleLicense?: string;
  items: OrderLineItem[];
  subtotal: number;
  fee: number;
  total: number;
  mode: OrderMode;
}

/**
 * API response / payload types
 * These describe the shape of data exchanged with the backend (see src/api.ts).
 */

export interface Category {
  name: string;
  sub: string;
  image: string;
}

export interface SiteContent {
  mascotUrl: string;
  heroBgUrl: string;
  mascotWaveUrl: string;
  mapUrl: string;
  aboutInteriorUrl: string;
  baristaPourUrl: string;
  roastBeansUrl: string;
  mistyForestUrl: string;
  instagramPhotos: string[];
  contact: {
    address: string;
    hours: string;
    kitchenNote: string;
    phone: string;
    email: string;
  };
}

// Payload sent to POST /api/orders. The server recomputes pricing from
// menu item ids + quantities rather than trusting client-calculated totals.
export interface CreateOrderPayload {
  fullName: string;
  phone: string;
  address: string;
  vehicleLicense?: string;
  mode: OrderMode;
  items: { menuItemId: string; quantity: number }[];
}

// Response returned by POST /api/orders
export interface CreateOrderResponse {
  orderId: string;
  fullName: string;
  phone: string;
  address: string;
  vehicleLicense?: string;
  items: OrderLineItem[];
  subtotal: number;
  fee: number;
  total: number;
  mode: OrderMode;
  createdAt: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

export interface NewsletterPayload {
  email: string;
}
