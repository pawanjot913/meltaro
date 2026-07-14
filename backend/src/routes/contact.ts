import { Router } from 'express';
import {
  submitContact,
  getAllContactMessages,
  markMessageRead,
  subscribeNewsletter,
  getAllSubscribers
} from '../controllers/contactController.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { contactMessageSchema, newsletterSchema } from '../utils/schemas.js';

const router = Router();

// Public
router.post('/contact', validateBody(contactMessageSchema), submitContact);
router.post('/newsletter', validateBody(newsletterSchema), subscribeNewsletter);

// Admin
router.get('/admin/contact', requireAdmin, getAllContactMessages);
router.patch('/admin/contact/:id/read', requireAdmin, markMessageRead);
router.get('/admin/newsletter', requireAdmin, getAllSubscribers);

export default router;
