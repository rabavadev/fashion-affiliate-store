import { Router } from 'express';
import {
  handleAdminLogin,
  handleAdminMe,
  handleAdminLogout,
  handleGetAdminProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleGetWhitelist,
  handleAddWhitelist,
  handleDeleteWhitelist,
  handleGetAnalytics,
  handleGetRetailers,
} from '../controllers/adminController';
import { requireAdminAuth } from '../middleware/adminAuth';
import {
  validateBody,
  adminLoginSchema,
  adminCreateProductSchema,
  adminUpdateProductSchema,
  adminWhitelistSchema,
} from '../middleware/validation';

export function createAdminRouter(): Router {
  const router = Router();

  // Public Admin Auth
  router.post('/auth/login', validateBody(adminLoginSchema), handleAdminLogin);
  router.get('/auth/me', requireAdminAuth, handleAdminMe);
  router.post('/auth/logout', handleAdminLogout);

  // Protected Product CRM CRUD
  router.get('/products', requireAdminAuth, handleGetAdminProducts);
  router.post('/products', requireAdminAuth, validateBody(adminCreateProductSchema), handleCreateProduct);
  router.put('/products/:id', requireAdminAuth, validateBody(adminUpdateProductSchema), handleUpdateProduct);
  router.delete('/products/:id', requireAdminAuth, handleDeleteProduct);

  // Protected Domain Whitelist CRM
  router.get('/whitelist', requireAdminAuth, handleGetWhitelist);
  router.post('/whitelist', requireAdminAuth, validateBody(adminWhitelistSchema), handleAddWhitelist);
  router.delete('/whitelist/:id', requireAdminAuth, handleDeleteWhitelist);

  // Protected Analytics CRM
  router.get('/analytics', requireAdminAuth, handleGetAnalytics);

  // Protected Retailers
  router.get('/retailers', requireAdminAuth, handleGetRetailers);

  return router;
}

export default createAdminRouter();
