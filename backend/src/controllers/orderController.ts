import { Request, Response } from 'express';
import { MenuItem, Order } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logger } from '../config/logger.js';

/* ------------------------------------------------------------------ */
/* Public Routes                                                        */
/* ------------------------------------------------------------------ */

/**
 * POST /api/orders
 * Accepts a list of { menuItemId, quantity } pairs — the server looks
 * up each menu item's current price from the database and recomputes
 * subtotal/fee/total. The client's local price calculations are ignored
 * entirely, so a price change on the menu side takes effect immediately.
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, phone, address, vehicleLicense, mode, items } = req.body;

  // Resolve every line item against the DB — fail the whole order if
  // even one menuItemId doesn't exist, rather than silently skipping it.
  const resolvedItems = await Promise.all(
    items.map(async ({ menuItemId, quantity }: { menuItemId: string; quantity: number }) => {
      const menuItem = await MenuItem.findById(menuItemId).lean();
      if (!menuItem) {
        throw ApiError.badRequest(`Menu item not found: "${menuItemId}"`);
      }
      return {
        menuItemId: (menuItem as any)._id,
        name: (menuItem as any).name,
        price: (menuItem as any).price, // price snapshotted at time of order
        quantity,
        image: (menuItem as any).image
      };
    })
  );

  const DELIVERY_FEE = 5.99;
  const CARHOP_FEE = 2.50;
  const subtotal = resolvedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const fee = mode === 'delivery' ? DELIVERY_FEE : mode === 'carhop' ? CARHOP_FEE : 0;
  const total = subtotal + fee;

  const order = await Order.create({
    fullName,
    phone,
    address,
    vehicleLicense,
    mode,
    userId: req.customer?.id,
    userEmail: req.customer?.email,
    items: resolvedItems,
    subtotal,
    fee,
    total
  });

  logger.info('New order placed', {
    orderId: order._id,
    mode: order.mode,
    total,
    fullName,
    userId: req.customer?.id,
  });

  res.status(201).json(order.toJSON());
});

/** GET /api/orders/:id — public order status lookup */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ ...(order as any), orderId: (order as any)._id, _id: undefined, __v: undefined });
});

/* ------------------------------------------------------------------ */
/* Admin Routes                                                         */
/* ------------------------------------------------------------------ */

/** GET /api/admin/orders — all orders, newest first */
export const getAllOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  const mapped = orders.map(({ _id, __v, ...rest }: any) => ({ orderId: _id, ...rest }));
  res.json(mapped);
});

/** PATCH /api/admin/orders/:id/status */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!order) throw ApiError.notFound('Order not found');
  res.json(order.toJSON());
});
