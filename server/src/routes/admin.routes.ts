import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const productController = new ProductController();
const orderController = new OrderController();

// Всі маршрути вимагають авторизації та ролі ADMIN
router.use(authenticate);
router.use(authorize(Role.ADMIN));

// Products
router.get('/products', productController.getAllAdmin.bind(productController));
router.post('/products', productController.create.bind(productController));
router.put('/products/:id', productController.update.bind(productController));
router.delete('/products/:id', productController.delete.bind(productController));

// Orders
router.get('/orders', orderController.getAllAdmin.bind(orderController));
router.get('/orders/stats', orderController.getStats.bind(orderController));
router.patch('/orders/:id/status', orderController.updateStatus.bind(orderController));
router.delete('/orders/:id', orderController.delete.bind(orderController));

export default router;
