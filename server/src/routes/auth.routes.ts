import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/profile', authenticate, controller.getProfile);

export default router;
