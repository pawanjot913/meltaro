import { Request, Response } from 'express';
import { MenuItem } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/* ------------------------------------------------------------------ */
/* Public Routes                                                        */
/* ------------------------------------------------------------------ */

/** GET /api/menu */
export const getAllMenuItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 }).lean();
  // lean() returns plain JS objects. The toJSON transform won't run on
  // lean docs, so we rename _id -> id manually here.
  const mapped = items.map(({ _id, __v, ...rest }) => ({ id: _id, ...rest }));
  res.json(mapped);
});

/** GET /api/menu/:id */
export const getMenuItemById = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuItem.findById(req.params.id).lean();
  if (!item) throw ApiError.notFound('Menu item not found');
  const { _id, __v, ...rest } = item as any;
  res.json({ id: _id, ...rest });
});

/* ------------------------------------------------------------------ */
/* Admin Routes (protected by requireAdmin middleware in the router)    */
/* ------------------------------------------------------------------ */

/** POST /api/admin/menu */
export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { id, ...rest } = req.body;
  if (!id) throw ApiError.badRequest('id (slug) is required when creating a menu item');

  const existing = await MenuItem.findById(id);
  if (existing) throw ApiError.conflict(`A menu item with id "${id}" already exists`);

  const item = await MenuItem.create({ _id: id, ...rest });
  const { _id: _unused, __v, ...plain } = item.toObject() as any;
  res.status(201).json({ id, ...plain });
});

/** PUT /api/admin/menu/:id */
export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuItem.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();
  if (!item) throw ApiError.notFound('Menu item not found');
  const { _id, __v, ...rest } = item as any;
  res.json({ id: _id, ...rest });
});

/** DELETE /api/admin/menu/:id */
export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('Menu item not found');
  res.json({ success: true, deleted: req.params.id });
});
