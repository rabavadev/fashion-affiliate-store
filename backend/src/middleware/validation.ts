import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const productsQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  subcategory: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tag: z.string().trim().max(50).optional(),
});

export const productIdParamSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID cannot be empty').max(100),
});

export const redirectQuerySchema = z.object({
  url: z.string({
    required_error: 'url query parameter is required',
    invalid_type_error: 'url query parameter must be a string',
  }).trim().min(1, 'url query parameter cannot be empty'),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(100),
});

export const adminCreateProductSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  subtitle: z.string().trim().max(200).optional().default(''),
  category: z.string().trim().min(1).max(100).optional().default('clothing'),
  subcategory: z.string().trim().min(1, 'Subcategory is required').max(100),
  tags: z.array(z.string().trim()).optional().default([]),
  price: z.coerce.number().positive('Price must be greater than zero'),
  originalPrice: z.coerce.number().positive().optional(),
  currency: z.literal('USD').optional().default('USD'),
  primaryImage: z.string().trim().url('Primary image must be a valid URL'),
  secondaryImage: z.string().trim().url('Secondary image must be a valid URL').optional(),
  galleryImages: z.array(z.string().trim().url()).optional().default([]),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string(),
    inStock: z.boolean().optional().default(true),
  })).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  inStock: z.boolean().optional().default(true),
  rating: z.coerce.number().min(0).max(5).optional().default(4.5),
  reviewCount: z.coerce.number().int().min(0).optional().default(0),
  retailerName: z.string().trim().min(1).max(100).optional().default('MANGO'),
  retailerId: z.string().trim().max(100).optional().default('mango-us'),
  affiliateUrl: z.string().trim().url('Affiliate URL must be a valid URL'),
  affiliatePartner: z.string().trim().max(100).optional().default('Rakuten'),
  description: z.string().trim().max(2000).optional().default(''),
  composition: z.string().trim().max(500).optional().default(''),
});

export const adminUpdateProductSchema = adminCreateProductSchema.partial();

export const adminWhitelistSchema = z.object({
  domain: z.string().trim().min(3, 'Domain must be at least 3 characters').max(255).regex(
    /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
    'Domain must be a valid fully-qualified domain name (e.g. shop.mango.com)'
  ),
});

/**
 * Express middleware to validate req.query using a Zod schema.
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          message: err.errors.map((e) => e.message).join('; ') || 'Invalid query parameters',
          details: err.flatten(),
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Express middleware to validate req.params using a Zod schema.
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          message: err.errors.map((e) => e.message).join('; ') || 'Invalid URL parameters',
          details: err.flatten(),
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Express middleware to validate req.body using a Zod schema.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          message: err.errors.map((e) => e.message).join('; ') || 'Invalid request body',
          details: err.flatten(),
        });
        return;
      }
      next(err);
    }
  };
}
