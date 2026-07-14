import { Router } from 'express';
import { login, refresh, logout, getMe } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema } from '../utils/schemas.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);   // uses httpOnly cookie — no body needed
router.post('/logout', logout);
router.get('/me', requireAdmin, getMe);

export default router;
