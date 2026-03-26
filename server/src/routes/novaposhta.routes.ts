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
    const { cityRef, type, cityName } = req.body;
    console.log('[NovaPoshta API] /warehouses request:', { cityRef, type, cityName });

    if (!cityRef) {
      return res.status(400).json({ error: 'cityRef is required' });
    }

    // ✅ ОТРИМУЄМО НАЗВУ МІСТА З КОРЕКТНОГО ЗАПИТУ АБО З CITYREF (ЯКЩО ЦЕ ОПИС)
    let resolvedCityName = cityName;
    
    // Якщо cityName не передано, але cityRef виглядає як опис (містить кому),
    // намагаємося витягти назву міста з нього
    if (!resolvedCityName && cityRef && (cityRef.includes(',') || cityRef.length > 50)) {
      resolvedCityName = cityRef.split(',')[0].trim();
      console.log('[NovaPoshta API] /warehouses: extracted cityName from cityRef:', resolvedCityName);
    }

    let warehouses;
    if (type === 'postomat') {
      // ✅ ПЕРЕДАЄМО cityName ДЛЯ FALLBACK
      warehouses = await service.getPostomats(cityRef, resolvedCityName || '');
    } else if (type === 'courier') {
      // Для кур'єрської доставки відділення не потрібне
      warehouses = [];
    } else {
      // ✅ ПЕРЕДАЄМО cityName ДЛЯ FALLBACK
      warehouses = await service.getWarehouses(cityRef, resolvedCityName || '');
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

// ✅ ОТРИМАННЯ ВСІХ ТИПІВ ДОСТАВКИ ОДНОЧАСНО
router.post('/all-delivery-options', async (req, res, next) => {
  try {
    const { cityRef, cityName } = req.body;
    console.log('[NovaPoshta API] /all-delivery-options request:', { cityRef, cityName });

    if (!cityRef || !cityName) {
      return res.status(400).json({ error: 'cityRef and cityName are required' });
    }

    const deliveryOptions = await service.getAllDeliveryOptions(cityRef, cityName);
    console.log('[NovaPoshta API] /all-delivery-options response:', {
      warehousesCount: deliveryOptions.warehouses.length,
      postomatsCount: deliveryOptions.postomats.length
    });

    res.json({ success: true, data: deliveryOptions });
  } catch (error: any) {
    console.error('[NovaPoshta API] /all-delivery-options error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to get delivery options'
    });
  }
});

export default router;
