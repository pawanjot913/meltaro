import { Request, Response } from 'express';
import { Category, Review, SiteContent, SITE_CONTENT_SINGLETON_ID } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/* ------------------------------------------------------------------ */
/* Categories                                                           */
/* ------------------------------------------------------------------ */

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ order: 1 }).lean();
  res.json(categories.map(({ _id: _unused, __v, ...rest }) => rest));
});

/* ------------------------------------------------------------------ */
/* Reviews                                                              */
/* ------------------------------------------------------------------ */

export const getReviews = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await Review.find({ isPublished: true }).lean();
  res.json(reviews.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest })));
});

/* ------------------------------------------------------------------ */
/* Site Content (singleton)                                             */
/* ------------------------------------------------------------------ */

export const getSiteContent = asyncHandler(async (_req: Request, res: Response) => {
  const content = await SiteContent.findById(SITE_CONTENT_SINGLETON_ID);
  if (!content) throw ApiError.notFound('Site content has not been seeded yet. Run: npm run seed');
  res.json(content.toJSON());
});
