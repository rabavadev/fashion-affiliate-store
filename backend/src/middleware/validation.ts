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
