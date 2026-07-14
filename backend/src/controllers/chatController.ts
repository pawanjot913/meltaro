import { Request, Response } from 'express';
import { getReply } from '../services/chatService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/** POST /api/chat */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body;
  const result = await getReply(message, history ?? []);
  res.json(result);
});
