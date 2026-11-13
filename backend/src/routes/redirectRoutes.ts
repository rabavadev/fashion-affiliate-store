import { Router, RequestHandler } from 'express';
import {
  handleProductRedirect,
  handleUrlRedirect,
} from '../controllers/redirectController';
import {
  validateQuery,
  validateParams,
  redirectQuerySchema,
  productIdParamSchema,
} from '../middleware/validation';
import { redirectLimiter as defaultRedirectLimiter } from '../middleware/rateLimiters';

export function createRedirectRouter(limiter: RequestHandler = defaultRedirectLimiter): Router {
  const router = Router();

  // Mode B: Redirect by target URL query parameter
  router.get('/', limiter, validateQuery(redirectQuerySchema), handleUrlRedirect);

  // Mode A: Redirect by internal curated product ID
  router.get('/:productId', limiter, validateParams(productIdParamSchema), handleProductRedirect);

  return router;
}

const defaultRouter = createRedirectRouter();
export default defaultRouter;
