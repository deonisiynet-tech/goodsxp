import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { OrderController } from '../controllers/order.controller.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const productController = new ProductController();
const orderController = new OrderController();
const adminController = new AdminController();

// ✅ ПУБЛІЧНИЙ ДОСТУП: Статус магазину (для middleware maintenance mode)
// Цей маршрут має бути ПЕРЕД авторизацією!
router.get('/settings/storeEnabled', (req, res, next) => {
  adminController.getSetting(req, res, next);
});

// Всі маршрути вимагають авторизації та ролі ADMIN
router.use(authenticate);
router.use(authorize(Role.ADMIN));

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats.bind(adminController));

// Sales Stats (for chart)
router.get('/stats/sales', adminController.getSalesStats.bind(adminController));

// Top Products
router.get('/products/top', adminController.getTopProducts.bind(adminController));

// Admin Logs
router.get('/logs', adminController.getLogs.bind(adminController));
router.get('/logs/system', adminController.getSystemLogs.bind(adminController));
router.post('/logs/clear', adminController.clearLogs.bind(adminController));
router.get('/logs/stats', adminController.getLogStats.bind(adminController));

// Site Settings
router.get('/settings', adminController.getSettings.bind(adminController));
router.get('/settings/:key', adminController.getSetting.bind(adminController));
router.put('/settings/:key', adminController.updateSetting.bind(adminController));

// Users Management
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.post('/users/:id/reset-password', adminController.resetUserPassword.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Categories - REMOVED (Category model not in schema)
// Categories endpoints are deprecated

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
