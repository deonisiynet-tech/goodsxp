import { Router } from 'express';
import { NovaPoshtaService } from '../services/novaposhta.service.js';

const router = Router();
const service = new NovaPoshtaService();

// Search cities
router.post('/cities', async (req, res, next) => {
  try {
    const { searchQuery } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ error: 'searchQuery is required' });
    }

    const cities = await service.searchCities(searchQuery);
    res.json({ success: true, data: cities });
  } catch (error: any) {
    console.error('Nova Poshta cities error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to search cities'
    });
  }
});

// Get warehouses by city
router.post('/warehouses', async (req, res, next) => {
  try {
    const { cityRef, type } = req.body;

    if (!cityRef) {
      return res.status(400).json({ error: 'cityRef is required' });
    }

    let warehouses;
    if (type === 'postomat') {
      warehouses = await service.getPostomats(cityRef);
    } else {
      warehouses = await service.getWarehouses(cityRef);
    }

    res.json({ success: true, data: warehouses });
  } catch (error: any) {
    console.error('Nova Poshta warehouses error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to get warehouses'
    });
  }
});

export default router;
