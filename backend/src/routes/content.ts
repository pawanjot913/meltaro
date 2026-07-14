import { Router } from 'express';
import { getCategories, getReviews, getSiteContent } from '../controllers/contentController.js';

const router = Router();

router.get('/categories', getCategories);
router.get('/reviews', getReviews);
router.get('/content', getSiteContent);

export default router;
