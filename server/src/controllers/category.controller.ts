import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { processImageUpload } from '../middleware/upload.js';

const categoryService = new CategoryService();

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, parentId } = req.query;
      const result = await categoryService.getAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 100,
        parentId: parentId as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllTree(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.getAllTree();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getById(req.params.id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, slug, description, parentId } = req.body;

      let imageUrl: string | undefined = undefined;

      if (req.files?.image) {
        const file = Array.isArray(req.files.image)
          ? req.files.image[0]
          : req.files.image;
        imageUrl = await processImageUpload(file);
      }

      const category = await categoryService.create({
        name,
        slug,
        description,
        imageUrl,
        parentId,
      });

      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, slug, description, parentId } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (slug) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) updateData.parentId = parentId;

      if (req.files?.image) {
        const file = Array.isArray(req.files.image)
          ? req.files.image[0]
          : req.files.image;
        updateData.imageUrl = await processImageUpload(file);
      }

      const category = await categoryService.update(id, updateData);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.delete(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
