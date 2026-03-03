import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { OrderController } from '../controllers/order.controller.js';
import { CategoryController } from '../controllers/category.controller.js';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const productController = new ProductController();
const orderController = new OrderController();
const categoryController = new CategoryController();
const adminController = new AdminController();

// Всі маршрути вимагають авторизації та ролі ADMIN
router.use(authenticate);
router.use(authorize(Role.ADMIN));

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats.bind(adminController));

// Admin Logs
router.get('/logs', adminController.getLogs.bind(adminController));

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

// Categories
router.get('/categories', categoryController.getAll.bind(categoryController));
router.get('/categories/tree', categoryController.getAllTree.bind(categoryController));
router.get('/categories/:id', categoryController.getById.bind(categoryController));
router.post('/categories', categoryController.create.bind(categoryController));
router.put('/categories/:id', categoryController.update.bind(categoryController));
router.delete('/categories/:id', categoryController.delete.bind(categoryController));

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
