import { Router } from 'express';
import {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuController.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { menuItemSchema, menuItemUpdateSchema } from '../utils/schemas.js';

const router = Router();

// Public
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Admin — all routes below require a valid JWT
router.post('/admin/menu', requireAdmin, validateBody(menuItemSchema), createMenuItem);
router.put('/admin/menu/:id', requireAdmin, validateBody(menuItemUpdateSchema), updateMenuItem);
router.delete('/admin/menu/:id', requireAdmin, deleteMenuItem);

export default router;
