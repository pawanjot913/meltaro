import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireCustomer } from '../middleware/requireCustomer.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../utils/schemas.js';

const router = Router();

// Customer auth required to place orders (Supabase JWT)
router.post('/', requireCustomer, validateBody(createOrderSchema), createOrder);
// Public order status lookup
router.get('/:id', getOrderById);

// Admin
router.get('/admin/orders', requireAdmin, getAllOrders);
router.patch('/admin/orders/:id/status', requireAdmin, validateBody(updateOrderStatusSchema), updateOrderStatus);

export default router;
