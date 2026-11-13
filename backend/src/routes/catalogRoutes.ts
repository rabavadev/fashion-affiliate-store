import { Router } from 'express';
import {
  listProducts,
  getProduct,
  listCategories,
} from '../controllers/catalogController';
import {
  validateQuery,
  validateParams,
  productsQuerySchema,
  productIdParamSchema,
} from '../middleware/validation';

const router = Router();

router.get('/products', validateQuery(productsQuerySchema), listProducts);
router.get('/products/:productId', validateParams(productIdParamSchema), getProduct);
router.get('/categories', listCategories);

export default router;
