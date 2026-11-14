import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// ใครก็ดูเมนูได้
router.get('/', getProducts);
router.get('/:id', getProductById);

// เฉพาะแอดมิน
const adminOnly = [requireAuth, requireRole('ADMIN')];
router.post('/', adminOnly, createProduct);
router.patch('/:id', adminOnly, updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

export default router;