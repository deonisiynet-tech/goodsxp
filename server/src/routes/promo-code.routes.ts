import { Router } from 'express';
import { PromoCodeController } from '../controllers/promo-code.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateUuid } from '../middleware/validateUuid.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new PromoCodeController();

// Public route (for checkout validation) - must be registered separately in server.ts
router.post('/validate', controller.validate.bind(controller));

// Admin routes - these will be mounted under admin prefix with auth middleware already applied
router.get('/', authenticate, authorize(Role.ADMIN), controller.getAll.bind(controller));
router.get('/:id', authenticate, authorize(Role.ADMIN), validateUuid('id'), controller.getById.bind(controller));
router.post('/', authenticate, authorize(Role.ADMIN), controller.create.bind(controller));
router.put('/:id', authenticate, authorize(Role.ADMIN), validateUuid('id'), controller.update.bind(controller));
router.delete('/:id', authenticate, authorize(Role.ADMIN), validateUuid('id'), controller.delete.bind(controller));

export default router;
