import { Request, Response } from 'express';
import { ContactMessage, NewsletterSubscriber } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logger } from '../config/logger.js';

/* ------------------------------------------------------------------ */
/* Contact Form                                                         */
/* ------------------------------------------------------------------ */

/** POST /api/contact */
export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  await ContactMessage.create({ name, email, message });
  logger.info('New contact message', { name, email });
  res.status(201).json({ success: true });
});

/** GET /api/admin/contact — view all messages (admin only) */
export const getAllContactMessages = asyncHandler(async (_req: Request, res: Response) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  res.json(messages.map(({ _id, __v, ...rest }: any) => ({ id: _id, ...rest })));
});

/** PATCH /api/admin/contact/:id/read — mark a message as read (admin only) */
export const markMessageRead = asyncHandler(async (req: Request, res: Response) => {
  const msg = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { $set: { isRead: true } },
    { new: true }
  );
  if (!msg) throw ApiError.notFound('Contact message not found');
  res.json({ success: true });
});

/* ------------------------------------------------------------------ */
/* Newsletter                                                           */
/* ------------------------------------------------------------------ */

/** POST /api/newsletter */
export const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    await NewsletterSubscriber.create({ email });
  } catch (err: any) {
    // Duplicate key — email already subscribed. Treat as success so we
    // don't leak whether an email is already in our list.
    if (err.code === 11000) {
      res.json({ success: true });
      return;
    }
    throw err;
  }
  res.status(201).json({ success: true });
});

/** GET /api/admin/newsletter — list all subscribers (admin only) */
export const getAllSubscribers = asyncHandler(async (_req: Request, res: Response) => {
  const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 }).lean();
  res.json(subscribers.map(({ _id, __v, ...rest }: any) => ({ id: _id, ...rest })));
});
