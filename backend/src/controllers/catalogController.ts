import { Request, Response } from 'express';
import { getProducts, getProductById, getCategories, GetProductsQuery } from '../services/catalogService';

/**
 * Controller to list products with filtering, search, sorting, and pagination.
 */
export function listProducts(req: Request, res: Response): void {
  const query = req.query as unknown as GetProductsQuery;
  const result = getProducts(query);
  res.json(result);
}

/**
 * Controller to retrieve a single product by ID or slug.
 */
export function getProduct(req: Request, res: Response): void {
  const { productId } = req.params;
  const product = getProductById(productId);

  if (!product) {
    res.status(404).json({
      status: 'error',
      message: `Product with ID or slug "${productId}" not found`,
    });
    return;
  }

  res.json({
    status: 'success',
    data: product,
  });
}

/**
 * Controller to retrieve available categories and subcategories with item counts.
 */
export function listCategories(_req: Request, res: Response): void {
  const categories = getCategories();
  res.json({
    status: 'success',
    data: categories,
  });
}
