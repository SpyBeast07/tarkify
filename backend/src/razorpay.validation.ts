import { z } from 'zod';

export const razorpayOrderSchema = z.object({
  id: z.string(),
  entity: z.string(),
  amount: z.number(),
  amount_paid: z.number(),
  amount_due: z.number(),
  currency: z.string(),
  receipt: z.string(),
  status: z.string(),
}).passthrough();

export const razorpayWebhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        email: z.string().optional(),
      }).passthrough(),
    }),
  }),
}).passthrough();
