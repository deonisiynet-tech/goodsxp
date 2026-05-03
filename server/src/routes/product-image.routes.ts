import { Router } from 'express';
import { productImageController } from '../controllers/product-image.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Отримати всі фото товару
router.get('/:productId', productImageController.getProductImages);

// Отримати фото для конкретного варіанту
router.get('/:productId/variant', productImageController.getImagesForVariant);

// Додати фото (тільки адмін)
router.post('/:productId', authenticate, authorize('ADMIN'), productImageController.addImage);

// Очистити всі фото товару (тільки адмін) - для синхронізації
router.delete('/:productId/clear', authenticate, authorize('ADMIN'), productImageController.clearProductImages);

// Оновити прив'язку фото до варіанту (тільки адмін)
router.patch('/:imageId/variant', authenticate, authorize('ADMIN'), productImageController.updateImageVariant);

// Видалити фото (тільки адмін)
router.delete('/:imageId', authenticate, authorize('ADMIN'), productImageController.deleteImage);

// Оновити позиції фото (тільки адмін)
router.put('/:productId/positions', authenticate, authorize('ADMIN'), productImageController.updatePositions);

// Міграція існуючих фото (тільки адмін)
router.post('/:productId/migrate', authenticate, authorize('ADMIN'), productImageController.migrateProductImages);

export default router;
