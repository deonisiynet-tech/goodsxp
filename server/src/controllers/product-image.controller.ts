import { Request, Response, NextFunction } from 'express';
import { productImageService } from '../services/product-image.service.js';

export class ProductImageController {
  async getProductImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const images = await productImageService.getProductImages(productId);
      res.json({ success: true, images });
    } catch (error) {
      next(error);
    }
  }

  async getImagesForVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { variantValue } = req.query;
      const images = await productImageService.getImagesForVariant(
        productId,
        variantValue === 'null' || !variantValue ? null : String(variantValue)
      );
      res.json({ success: true, images });
    } catch (error) {
      next(error);
    }
  }

  async addImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { imageUrl, variantValue, position } = req.body;
      const image = await productImageService.addImage(productId, {
        imageUrl,
        variantValue: variantValue || null,
        position,
      });
      res.json({ success: true, image });
    } catch (error) {
      next(error);
    }
  }

  async updateImageVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageId } = req.params;
      const { variantValue } = req.body;
      const image = await productImageService.updateImageVariant(
        imageId,
        variantValue || null
      );
      res.json({ success: true, image });
    } catch (error) {
      next(error);
    }
  }

  async clearProductImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const result = await productImageService.clearProductImages(productId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageId } = req.params;
      await productImageService.deleteImage(imageId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async updatePositions(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { imageIds } = req.body;
      await productImageService.updatePositions(productId, imageIds);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async migrateProductImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const result = await productImageService.migrateProductImages(productId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export const productImageController = new ProductImageController();
