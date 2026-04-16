import { Router } from 'express';
import { Role } from '@prisma/client';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const controller = new ProductController();

router.use(authenticate, authorize(Role.ADMIN));
router.delete('/:id', controller.deleteSpecification);

export default router;
