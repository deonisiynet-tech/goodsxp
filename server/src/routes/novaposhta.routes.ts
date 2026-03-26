import { Router } from 'express';
import { NovaPoshtaService } from '../services/novaposhta.service.js';

const router = Router();
const service = new NovaPoshtaService();

// ============================================================================
// /cities - Поиск городов
// ============================================================================
router.post('/cities', async (req, res, next) => {
  try {
    const { searchQuery } = req.body;
    console.log('='.repeat(60));
    console.log('[NovaPoshta API] /cities - START');
    console.log('[NovaPoshta API] /cities - Request body:', JSON.stringify(req.body, null, 2));

    if (!searchQuery) {
      console.warn('[NovaPoshta API] /cities - Missing searchQuery');
      return res.status(400).json({ error: 'searchQuery is required' });
    }

    console.log('[NovaPoshta API] /cities - Searching for:', searchQuery);
    const cities = await service.searchCities(searchQuery);
    console.log('[NovaPoshta API] /cities - Found', cities.length, 'cities');

    if (cities.length > 0) {
      console.log('[NovaPoshta API] /cities - First city:', {
        Ref: cities[0].Ref,
        Description: cities[0].Description
      });
    }

    console.log('[NovaPoshta API] /cities - END');
    console.log('='.repeat(60));

    res.json({ success: true, data: cities });
  } catch (error: any) {
    console.error('[NovaPoshta API] /cities - ❌ ERROR:', error.message);
    if (error.response) {
      console.error('[NovaPoshta API] /cities - Error response:', error.response.data);
    }
    console.log('[NovaPoshta API] /cities - END (with error)');
    console.log('='.repeat(60));
    res.status(500).json({
      error: error.message || 'Failed to search cities'
    });
  }
});

// ============================================================================
// /warehouses - Получение отделений/почтоматов по городу
// ============================================================================
router.post('/warehouses', async (req, res, next) => {
  try {
    const { cityRef, type, cityName } = req.body;
    console.log('='.repeat(60));
    console.log('[NovaPoshta API] /warehouses - START');
    console.log('[NovaPoshta API] /warehouses - Request body:', JSON.stringify(req.body, null, 2));

    if (!cityRef) {
      console.warn('[NovaPoshta API] /warehouses - Missing cityRef');
      return res.status(400).json({ error: 'cityRef is required' });
    }

    // ✅ ОТРИМУЄМО НАЗВУ МІСТА З КОРЕКТНОГО ЗАПИТУ АБО З CITYREF (ЯКЩО ЦЕ ОПИС)
    let resolvedCityName = cityName;

    // Якщо cityName не передано, але cityRef виглядає як опис (містить кому),
    // намагаємося витягти назву міста з нього
    if (!resolvedCityName && cityRef && (cityRef.includes(',') || cityRef.length > 50)) {
      resolvedCityName = cityRef.split(',')[0].trim();
      console.log('[NovaPoshta API] /warehouses - Extracted cityName from cityRef:', resolvedCityName);
    }

    console.log('[NovaPoshta API] /warehouses - Using cityRef:', cityRef);
    console.log('[NovaPoshta API] /warehouses - Using cityName:', resolvedCityName || 'not provided');
    console.log('[NovaPoshta API] /warehouses - Type:', type || 'warehouse (default)');

    let warehouses;
    if (type === 'postomat') {
      console.log('[NovaPoshta API] /warehouses - Calling getPostomats...');
      warehouses = await service.getPostomats(cityRef, resolvedCityName || '');
    } else if (type === 'courier') {
      console.log('[NovaPoshta API] /warehouses - Courier delivery, no warehouses needed');
      warehouses = [];
    } else {
      console.log('[NovaPoshta API] /warehouses - Calling getWarehouses...');
      warehouses = await service.getWarehouses(cityRef, resolvedCityName || '');
    }

    console.log('[NovaPoshta API] /warehouses - Found', warehouses.length, 'warehouses');
    
    if (warehouses.length > 0) {
      console.log('[NovaPoshta API] /warehouses - First warehouse:', {
        Ref: warehouses[0].Ref,
        Number: warehouses[0].Number,
        ShortAddress: warehouses[0].ShortAddress
      });
    }

    console.log('[NovaPoshta API] /warehouses - END');
    console.log('='.repeat(60));

    res.json({ success: true, data: warehouses });
  } catch (error: any) {
    console.error('[NovaPoshta API] /warehouses - ❌ ERROR:', error.message);
    if (error.response) {
      console.error('[NovaPoshta API] /warehouses - Error response:', error.response.data);
    }
    console.log('[NovaPoshta API] /warehouses - END (with error)');
    console.log('='.repeat(60));
    res.status(500).json({
      error: error.message || 'Failed to get warehouses'
    });
  }
});

// ============================================================================
// /all-delivery-options - Получение всех типов доставки одновременно
// ============================================================================
router.post('/all-delivery-options', async (req, res, next) => {
  try {
    const { cityRef, cityName } = req.body;
    console.log('='.repeat(60));
    console.log('[NovaPoshta API] /all-delivery-options - START');
    console.log('[NovaPoshta API] /all-delivery-options - Request body:', JSON.stringify(req.body, null, 2));

    if (!cityRef || !cityName) {
      console.warn('[NovaPoshta API] /all-delivery-options - Missing required params');
      return res.status(400).json({ error: 'cityRef and cityName are required' });
    }

    console.log('[NovaPoshta API] /all-delivery-options - cityRef:', cityRef);
    console.log('[NovaPoshta API] /all-delivery-options - cityName:', cityName);
    console.log('[NovaPoshta API] /all-delivery-options - Calling getAllDeliveryOptions...');

    const deliveryOptions = await service.getAllDeliveryOptions(cityRef, cityName);
    
    console.log('[NovaPoshta API] /all-delivery-options - Results:');
    console.log('[NovaPoshta API] /all-delivery-options -   Warehouses:', deliveryOptions.warehouses.length);
    console.log('[NovaPoshta API] /all-delivery-options -   Postomats:', deliveryOptions.postomats.length);

    if (deliveryOptions.warehouses.length > 0) {
      console.log('[NovaPoshta API] /all-delivery-options - First warehouse:', deliveryOptions.warehouses[0].Number);
    }
    if (deliveryOptions.postomats.length > 0) {
      console.log('[NovaPoshta API] /all-delivery-options - First postomat:', deliveryOptions.postomats[0].Number);
    }

    console.log('[NovaPoshta API] /all-delivery-options - END');
    console.log('='.repeat(60));

    res.json({ success: true, data: deliveryOptions });
  } catch (error: any) {
    console.error('[NovaPoshta API] /all-delivery-options - ❌ ERROR:', error.message);
    if (error.response) {
      console.error('[NovaPoshta API] /all-delivery-options - Error response:', error.response.data);
    }
    console.log('[NovaPoshta API] /all-delivery-options - END (with error)');
    console.log('='.repeat(60));
    res.status(500).json({
      error: error.message || 'Failed to get delivery options'
    });
  }
});

export default router;
