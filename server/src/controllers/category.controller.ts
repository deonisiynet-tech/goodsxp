// Category controller has been removed - Category model is no longer in the schema
// This file is kept for build compatibility but should not be used

import { Request, Response } from 'express';

export class CategoryController {
  async getAll(_req: Request, res: Response) {
    res.json({ error: 'Category endpoints are deprecated' })
  }

  async getAllTree(_req: Request, res: Response) {
    res.json({ error: 'Category endpoints are deprecated' })
  }

  async getById(_req: Request, res: Response) {
    res.json({ error: 'Category endpoints are deprecated' })
  }

  async create(_req: Request, res: Response) {
    res.status(400).json({ error: 'Category endpoints are deprecated' })
  }

  async update(_req: Request, res: Response) {
    res.status(400).json({ error: 'Category endpoints are deprecated' })
  }

  async delete(_req: Request, res: Response) {
    res.status(400).json({ error: 'Category endpoints are deprecated' })
  }
}
