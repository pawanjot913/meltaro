import { z } from 'zod';
import { ORDER_MODES, ORDER_STATUSES } from '../models/Order.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createOrderSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    phone: z
      .string()
      .trim()
      .min(7, 'Phone number looks too short')
      .regex(/^\+?[0-9\s-]{7,15}$/, 'Invalid phone number format'),
    address: z.string().trim().optional().default(''),
    vehicleLicense: z.string().trim().optional(),
    mode: z.enum(ORDER_MODES),
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1),
          quantity: z.number().int().positive()
        })
      )
      .min(1, 'Order must include at least one item')
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'delivery' && !data.address.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Delivery address is required' });
    }
    if (data.mode === 'carhop' && !data.vehicleLicense?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vehicleLicense'], message: 'Vehicle license plate is required for Car-Hop orders' });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES)
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('A valid email address is required'),
  message: z.string().trim().min(1, 'Message is required')
});

export const newsletterSchema = z.object({
  email: z.string().trim().email('A valid email address is required')
});

export const chatSchema = z.object({
  message: z.string().trim().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string()
      })
    )
    .optional()
    .default([])
});

export const menuItemSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id must be a lowercase slug (letters, numbers, hyphens only)')
    .optional(), // optional on update; required on create (enforced in controller)
  name: z.string().trim().min(1),
  price: z.number().nonnegative(),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  image: z.string().trim().url('image must be a valid URL'),
  isPopular: z.boolean().optional(),
  ingredients: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export const menuItemUpdateSchema = menuItemSchema.partial();
