import { Router } from 'express';
import { NovaPoshtaService } from '../services/novaposhta.service.js';

const router = Router();
const service = new NovaPoshtaService();

// Search cities
router.post('/cities', async (req, res, next) => {
  try {
    const { searchQuery } = req.body;
    console.log('[NovaPoshta API] /cities request:', { searchQuery });

    if (!searchQuery) {
      return res.status(400).json({ error: 'searchQuery is required' });
    }

    const cities = await service.searchCities(searchQuery);
    console.log('[NovaPoshta API] /cities response:', { count: cities.length });

    res.json({ success: true, data: cities });
  } catch (error: any) {
    console.error('[NovaPoshta API] /cities error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to search cities'
    });
  }
});

// Get warehouses by city
router.post('/warehouses', async (req, res, next) => {
  try {
    const { cityRef, type, cityName } = req.body;  // ✅ ДОДАВЛЕНО cityName
    console.log('[NovaPoshta API] /warehouses request:', { cityRef, type, cityName });

    if (!cityRef) {
      return res.status(400).json({ error: 'cityRef is required' });
    }

    let warehouses;
    if (type === 'postomat') {
      // ✅ ПЕРЕДАЄМО cityName ДЛЯ FALLBACK
      warehouses = await service.getPostomats(cityRef, cityName || '');
    } else {
      // ✅ ПЕРЕДАЄМО cityName ДЛЯ FALLBACK
      warehouses = await service.getWarehouses(cityRef, cityName || '');
    }

    console.log('[NovaPoshta API] /warehouses response:', { count: warehouses.length });

    res.json({ success: true, data: warehouses });
  } catch (error: any) {
    console.error('[NovaPoshta API] /warehouses error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to get warehouses'
    });
  }
});

export default router;
