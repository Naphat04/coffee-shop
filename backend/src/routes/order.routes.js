import { Router } from 'express';
import { createOrder, getOrderById } from '../controllers/order.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth); // ทุก route ในไฟล์นี้ต้องล็อกอิน

router.post('/', createOrder);
router.get('/:id', getOrderById);

export default router;