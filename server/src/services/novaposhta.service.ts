import axios from 'axios';

const NOVA_POSHTA_API_KEY = process.env.NOVA_POSHTA_API_KEY || 'fd61dad0d97e5d3479d7f3164b54b03f';
const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

console.log('[NovaPoshta] API Key configured:', NOVA_POSHTA_API_KEY ? 'YES' : 'NO');
console.log('[NovaPoshta] API URL:', NOVA_POSHTA_API_URL);

interface City {
  Ref: string;
  Description: string;
  RegionDescription: string;
  AreaDescription?: string;
}

interface Warehouse {
  Ref: string;
  Description: string;
  ShortAddress: string;
  Number: string;
  Latitude?: string;
  Longitude?: string;
  Type?: string;
  Schedule?: string;
}

export class NovaPoshtaService {
  async searchCities(cityName: string): Promise<City[]> {
    if (!cityName || cityName.trim().length < 2) {
      console.log('[NovaPoshta] searchCities: empty query, returning []');
      return [];
    }

    console.log('[NovaPoshta] searchCities: searching for', cityName);
    console.log('[NovaPoshta] API Key:', NOVA_POSHTA_API_KEY.substring(0, 8) + '...');

    try {
      // ✅ ПРАВИЛЬНИЙ ЗАПИТ ЗГІДНО З API NOVA POSHTA
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          CityName: cityName.trim(),  // ✅ CityName замість SettlementName
          Limit: 10,
        },
      };

      console.log('[NovaPoshta] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ЛОГУВАННЯ ПОВНОЇ ВІДПОВІДІ API
      console.log('NP FULL RESPONSE:', JSON.stringify(response.data, null, 2));

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] API errors:', response.data.errors);
        return [];
      }

      // Перевіряємо success
      if (!response.data.success) {
        console.error('[NovaPoshta] API returned success: false');
        return [];
      }

      // ✅ ПРАВИЛЬНА СТРУКТУРА ВІДПОВІДІ: response.data.data[0].Addresses
      const addressesData = response.data.data?.[0]?.Addresses || [];
      
      console.log('[NovaPoshta] Addresses:', JSON.stringify(addressesData, null, 2));
      console.log('[NovaPoshta] searchCities: found', addressesData.length, 'cities');
      
      if (addressesData.length === 0) {
        console.log('[NovaPoshta] searchCities: no cities found');
        return [];
      }

      const cities = addressesData.map((city: any) => ({
        Ref: city.Ref,
        Description: city.Present,  // ✅ Present - назва міста
        RegionDescription: city.RegionDescription || '',
        AreaDescription: city.AreaDescription || '',
      }));

      if (cities.length > 0) {
        console.log('[NovaPoshta] First city:', cities[0]);
      }
      return cities;
    } catch (error: any) {
      console.error('[NovaPoshta] searchCities error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] Error response:', error.response.data);
      }
      return [];
    }
  }

  async getWarehouses(cityRef: string): Promise<Warehouse[]> {
    if (!cityRef) {
      console.log('[NovaPoshta] getWarehouses: empty cityRef, returning []');
      return [];
    }

    console.log('[NovaPoshta] getWarehouses: loading for cityRef', cityRef);

    try {
      // ✅ ВИКОРИСТОВУЄМО МОДЕЛЬ AddressGeneral З ПРАВИЛЬНИМИ ПАРАМЕТРАМИ
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          Limit: 100,  // ✅ ЗБІЛЬШЕНО ЛІМІТ
        },
      };

      console.log('[NovaPoshta] getWarehouses request:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ЛОГУВАННЯ ПОВНОЇ ВІДПОВІДІ API
      console.log('[NovaPoshta] getWarehouses FULL RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log('[NovaPoshta] getWarehouses response.data:', response.data.data);
      console.log('[NovaPoshta] getWarehouses response.data length:', Array.isArray(response.data.data) ? response.data.data.length : 'NOT ARRAY');

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getWarehouses API errors:', response.data.errors);
        
        // ✅ СПЕЦІАЛЬНА ОБРОБКА ПОМИЛКИ "City not found"
        if (response.data.errors.includes('City not found')) {
          console.warn('[NovaPoshta] getWarehouses: Місто не знайдено. Можливо CityRef застарів або некоректний.');
          console.warn('[NovaPoshta] getWarehouses FALLBACK: Спробуйте обрати інше місто');
        }
        
        return [];
      }

      // Перевіряємо success
      if (!response.data.success) {
        console.error('[NovaPoshta] getWarehouses API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ВІДДІЛЕННЯ - ПЕРЕВІРЯЄМО РІЗНІ ФОРМАТИ ВІДПОВІДІ
      let data = [];
      
      // Варіант 1: data - це масив відділень
      if (Array.isArray(response.data.data)) {
        data = response.data.data;
        console.log('[NovaPoshta] getWarehouses: data is array with', data.length, 'items');
      }
      // Варіант 2: data[0] містить warehouses
      else if (response.data.data && response.data.data[0] && Array.isArray(response.data.data[0].warehouses)) {
        data = response.data.data[0].warehouses;
        console.log('[NovaPoshta] getWarehouses: data[0].warehouses is array with', data.length, 'items');
      }
      // Варіант 3: data[0] містить settlements
      else if (response.data.data && response.data.data[0] && Array.isArray(response.data.data[0].settlements)) {
        data = response.data.data[0].settlements;
        console.log('[NovaPoshta] getWarehouses: data[0].settlements is array with', data.length, 'items');
      }
      // Варіант 4: порожня відповідь
      else {
        console.warn('[NovaPoshta] getWarehouses: невідомий формат відповіді');
        console.warn('[NovaPoshta] getWarehouses response.data type:', typeof response.data.data);
        console.warn('[NovaPoshta] getWarehouses response.data keys:', Object.keys(response.data.data || {}));
        return [];
      }

      console.log('[NovaPoshta] getWarehouses raw data count:', data.length);

      if (data.length === 0) {
        console.warn('[NovaPoshta] getWarehouses: API повернув пустий масив відділень для cityRef:', cityRef);
        console.warn('[NovaPoshta] getWarehouses FALLBACK: Відділення не знайдено. Спробуйте інший населений пункт');
        return [];
      }

      const warehouses = data.map((warehouse: any) => ({
        Ref: warehouse.Ref,
        Description: warehouse.Description,
        ShortAddress: warehouse.ShortAddress,
        Number: warehouse.Number,
        Latitude: warehouse.Latitude,
        Longitude: warehouse.Longitude,
        Type: warehouse.Type || 'Відділення',
        Schedule: warehouse.Schedule || 'Пн-Пт: 9:00-20:00, Сб: 9:00-18:00',
      }));

      console.log('[NovaPoshta] getWarehouses: знайдено', warehouses.length, 'відділень');
      
      // ✅ ЛОГУВАННЯ ПЕРШИХ 3 ВІДДІЛЕНЬ ДЛЯ ПЕРЕВІРКИ
      if (warehouses.length > 0) {
        console.log('[NovaPoshta] getWarehouses перші 3 відділення:', warehouses.slice(0, 3));
      }
      
      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getWarehouses error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] getWarehouses Error response:', error.response.data);
      }
      return [];
    }
  }

  async getPostomats(cityRef: string): Promise<Warehouse[]> {
    if (!cityRef) {
      console.log('[NovaPoshta] getPostomats: empty cityRef, returning []');
      return [];
    }

    console.log('[NovaPoshta] getPostomats: loading for cityRef', cityRef);

    try {
      // ✅ ВИКОРИСТОВУЄМО ПРАВИЛЬНУ МОДЕЛЬ AddressGeneral
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          TypeOfWarehouseRef: 'd904c7aa-4c45-4275-a111-99643895928b', // ✅ Почтомат
          Limit: 50,  // ✅ ЗБІЛЬШЕНО ЛІМІТ
        },
      };

      console.log('[NovaPoshta] getPostomats request:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ЛОГУВАННЯ ПОВНОЇ ВІДПОВІДІ API
      console.log('[NovaPoshta] getPostomats FULL RESPONSE:', JSON.stringify(response.data, null, 2));

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getPostomats API errors:', response.data.errors);
        
        // ✅ СПЕЦІАЛЬНА ОБРОБКА ПОМИЛКИ "City not found"
        if (response.data.errors.includes('City not found')) {
          console.warn('[NovaPoshta] getPostomats: Місто не знайдено. Можливо CityRef застарів або некоректний.');
          console.warn('[NovaPoshta] getPostomats FALLBACK: Спробуйте обрати інше місто');
        }
        
        return [];
      }

      // Перевіряємо success
      if (!response.data.success) {
        console.error('[NovaPoshta] getPostomats API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ПОШТОМАТИ З ПРАВИЛЬНОЇ СТРУКТУРИ
      const data = response.data.data || [];
      console.log('[NovaPoshta] getPostomats raw data count:', data.length);

      if (data.length === 0) {
        console.warn('[NovaPoshta] getPostomats: API повернув пустий масив почтоматів для cityRef:', cityRef);
        console.warn('[NovaPoshta] getPostomats FALLBACK: Спробуйте використати відділення замість почтоматів');
        return [];
      }

      const warehouses = data.map((warehouse: any) => ({
        Ref: warehouse.Ref,
        Description: warehouse.Description,
        ShortAddress: warehouse.ShortAddress,
        Number: warehouse.Number,
        Latitude: warehouse.Latitude,
        Longitude: warehouse.Longitude,
        Type: 'Почтомат',
        Schedule: '24/7',
      }));

      console.log('[NovaPoshta] getPostomats: знайдено', warehouses.length, 'почтоматів');
      
      // ✅ ЛОГУВАННЯ ПЕРШИХ 3 ПОШТОМАТІВ ДЛЯ ПЕРЕВІРКИ
      if (warehouses.length > 0) {
        console.log('[NovaPoshta] getPostomats перші 3 почтомати:', warehouses.slice(0, 3));
      }
      
      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getPostomats error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] getPostomats Error response:', error.response.data);
      }
      return [];
    }
  }
}
