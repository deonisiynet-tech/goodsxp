// Category service has been removed - Category model is no longer in the schema
// This file is kept for build compatibility but should not be used

export class CategoryService {
  async getAll() {
    throw new Error('Category service is deprecated - Category model removed from schema')
  }

  async getById() {
    throw new Error('Category service is deprecated - Category model removed from schema')
  }

  async create() {
    throw new Error('Category service is deprecated - Category model removed from schema')
  }

  async update() {
    throw new Error('Category service is deprecated - Category model removed from schema')
  }

  async delete() {
    throw new Error('Category service is deprecated - Category model removed from schema')
  }
}
