import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be 255 characters or less')
    .regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  short_description: z.string().trim().max(500, 'Short description must be 500 characters or less').optional().default(''),
  description: z.string().trim().optional().default(''),
  price: z.number().int().min(0, 'Price must be 0 or greater'),
  currency: z.string().trim().min(1).max(10).default('INR'),
  category: z.string().trim().max(100).default('General'),
  tags: z.array(z.string().trim().min(1).max(50)).max(20, 'Maximum 20 tags allowed').optional().default([]),
  visibility: z.enum(['public', 'hidden']).default('public'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seo_title: z.string().trim().max(255).optional().default(''),
  seo_description: z.string().trim().max(500).optional().default(''),
  og_image: z.string().trim().max(1000).optional().default(''),
  download_key: z.string().trim().max(255).optional().default(''),
  version: z.string().trim().min(1).max(50).default('1.0.0'),
  release_date: z.string().optional().default(''),
  release_notes: z.string().trim().optional().default(''),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  short_description: z.string().trim().max(500).optional(),
  description: z.string().trim().optional(),
  price: z.number().int().min(0).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  visibility: z.enum(['public', 'hidden']).optional(),
  seo_title: z.string().trim().max(255).optional(),
  seo_description: z.string().trim().max(500).optional(),
  og_image: z.string().trim().max(1000).optional(),
  download_key: z.string().trim().max(255).optional(),
  version: z.string().trim().min(1).max(50).optional(),
  release_date: z.string().optional(),
  release_notes: z.string().trim().optional(),
});
