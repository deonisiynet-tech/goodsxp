import { Router } from 'express';
import { PromoCodeController } from '../controllers/promo-code.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateUuid } from '../middleware/validateUuid.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new PromoCodeController();

// Public route (for checkout validation)
router.post('/validate', controller.validate.bind(controller));

// Admin routes
router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/', controller.getAll.bind(controller));
router.get('/:id', validateUuid('id'), controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', validateUuid('id'), controller.update.bind(controller));
router.delete('/:id', validateUuid('id'), controller.delete.bind(controller));

export default router;
