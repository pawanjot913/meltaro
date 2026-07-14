import { Router } from 'express';
import { chat } from '../controllers/chatController.js';
import { validateBody } from '../middleware/validate.js';
import { chatSchema } from '../utils/schemas.js';

const router = Router();

router.post('/', validateBody(chatSchema), chat);

export default router;
