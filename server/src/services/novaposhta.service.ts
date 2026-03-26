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
      // ✅ 1️⃣ ПОШУК МІСТА З SettlementName
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          SettlementName: cityName.trim(),  // ✅ SettlementName для пошуку
          Limit: 10,
        },
      };

      console.log('[NovaPoshta] searchCities request:', JSON.stringify(requestBody, null, 2));

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
      console.log('[NovaPoshta] searchCities FULL RESPONSE:', JSON.stringify(response.data, null, 2));

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] searchCities API errors:', response.data.errors);
        return [];
      }

      // Перевіряємо success
      if (!response.data.success) {
        console.error('[NovaPoshta] searchCities API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО МІСТА - ПЕРЕВІРЯЄМО РІЗНІ ФОРМАТИ
      let citiesData = [];
      
      // Варіант 1: data[0].settlements
      if (response.data.data?.[0]?.settlements) {
        citiesData = response.data.data[0].settlements;
        console.log('[NovaPoshta] searchCities: found settlements:', citiesData.length);
      }
      // Варіант 2: data[0].Addresses
      else if (response.data.data?.[0]?.Addresses) {
        citiesData = response.data.data[0].Addresses;
        console.log('[NovaPoshta] searchCities: found Addresses:', citiesData.length);
      }
      // Варіант 3: data - масив
      else if (Array.isArray(response.data.data)) {
        citiesData = response.data.data;
        console.log('[NovaPoshta] searchCities: found data array:', citiesData.length);
      }

      console.log('[NovaPoshta] searchCities citiesData:', JSON.stringify(citiesData, null, 2));

      if (citiesData.length === 0) {
        console.warn('[NovaPoshta] searchCities: Місто не знайдено');
        return [];
      }

      // ✅ ФІЛЬТРУЄМО: спочатку DeliveryCity, потім всі інші
      const deliveryCity = citiesData.find((city: any) => city.DeliveryCity);
      const city = deliveryCity || citiesData[0];

      console.log('[NovaPoshta] searchCities: selected city:', city);

      const cities = citiesData.map((settlement: any) => ({
        Ref: settlement.Ref,
        Description: settlement.Present || settlement.Description,
        RegionDescription: settlement.RegionDescription || '',
        AreaDescription: settlement.AreaDescription || '',
        DeliveryCity: settlement.DeliveryCity || false,
      }));

      console.log('[NovaPoshta] searchCities: found', cities.length, 'cities');
      if (cities.length > 0) {
        console.log('[NovaPoshta] searchCities: first city:', cities[0]);
      }
      return cities;
    } catch (error: any) {
      console.error('[NovaPoshta] searchCities error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] searchCities Error response:', error.response.data);
      }
      return [];
    }
  }

  async getWarehouses(cityRef: string, cityName?: string): Promise<Warehouse[]> {
    if (!cityRef) {
      console.log('[NovaPoshta] getWarehouses: empty cityRef, returning []');
      return [];
    }

    console.log('[NovaPoshta] getWarehouses: loading for cityRef', cityRef, 'cityName:', cityName);

    try {
      // ✅ 2️⃣ ОТРИМАННЯ ВІДДІЛЕНЬ З FALLBACK
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          Limit: 100,
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

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getWarehouses API errors:', response.data.errors);
        
        // ✅ FALLBACK: Якщо "City not found", пробуємо знайти місто заново
        if (response.data.errors.includes('City not found') && cityName) {
          console.warn('[NovaPoshta] getWarehouses: City not found, trying fallback...');
          const refreshedCity = await this.searchCities(cityName);
          if (refreshedCity.length > 0) {
            const newCityRef = refreshedCity[0].Ref;
            console.log('[NovaPoshta] getWarehouses: got new cityRef:', newCityRef);
            return this.getWarehouses(newCityRef);  // Рекурсивний виклик з новим CityRef
          }
        }
        
        return [];
      }

      // Перевіряємо success
      if (!response.data.success) {
        console.error('[NovaPoshta] getWarehouses API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ВІДДІЛЕННЯ - ПЕРЕВІРЯЄМО РІЗНІ ФОРМАТИ
      let data = [];
      
      // Варіант 1: data - масив відділень
      if (Array.isArray(response.data.data)) {
        data = response.data.data;
        console.log('[NovaPoshta] getWarehouses: data is array with', data.length, 'items');
      }
      // Варіант 2: data[0].warehouses
      else if (response.data.data?.[0]?.warehouses) {
        data = response.data.data[0].warehouses;
        console.log('[NovaPoshta] getWarehouses: data[0].warehouses with', data.length, 'items');
      }
      // Варіант 3: порожня відповідь
      else {
        console.warn('[NovaPoshta] getWarehouses: невідомий формат відповіді');
        console.warn('[NovaPoshta] getWarehouses response.data keys:', Object.keys(response.data.data || {}));
        
        // ✅ FALLBACK: Якщо місто не знайдено, пробуємо знайти його заново
        if (cityName) {
          console.warn('[NovaPoshta] getWarehouses: trying fallback search for city:', cityName);
          const refreshedCity = await this.searchCities(cityName);
          if (refreshedCity.length > 0) {
            const newCityRef = refreshedCity[0].Ref;
            console.log('[NovaPoshta] getWarehouses: got new cityRef:', newCityRef);
            return this.getWarehouses(newCityRef);
          }
        }
        
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
      
      // ✅ ЛОГУВАННЯ ПЕРШИХ 3 ВІДДІЛЕНЬ
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

  async getPostomats(cityRef: string, cityName?: string): Promise<Warehouse[]> {
    if (!cityRef) {
      console.log('[NovaPoshta] getPostomats: empty cityRef, returning []');
      return [];
    }

    console.log('[NovaPoshta] getPostomats: loading for cityRef', cityRef, 'cityName:', cityName);

    try {
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'AddressGeneral',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          TypeOfWarehouseRef: 'd904c7aa-4c45-4275-a111-99643895928b', // Почтомат
          Limit: 100,
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
        
        // ✅ FALLBACK: Якщо "City not found", пробуємо знайти місто заново
        if (response.data.errors.includes('City not found') && cityName) {
          console.warn('[NovaPoshta] getPostomats: City not found, trying fallback...');
          const refreshedCity = await this.searchCities(cityName);
          if (refreshedCity.length > 0) {
            const newCityRef = refreshedCity[0].Ref;
            console.log('[NovaPoshta] getPostomats: got new cityRef:', newCityRef);
            return this.getPostomats(newCityRef);
          }
        }
        
        return [];
      }

      // Перевіряємо success
      if (!response.data.success) {
        console.error('[NovaPoshta] getPostomats API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ПОШТОМАТИ
      let data = [];
      
      if (Array.isArray(response.data.data)) {
        data = response.data.data;
        console.log('[NovaPoshta] getPostomats: data is array with', data.length, 'items');
      }
      else if (response.data.data?.[0]?.warehouses) {
        data = response.data.data[0].warehouses;
        console.log('[NovaPoshta] getPostomats: data[0].warehouses with', data.length, 'items');
      }
      else {
        console.warn('[NovaPoshta] getPostomats: невідомий формат відповіді');
        
        // ✅ FALLBACK
        if (cityName) {
          console.warn('[NovaPoshta] getPostomats: trying fallback search for city:', cityName);
          const refreshedCity = await this.searchCities(cityName);
          if (refreshedCity.length > 0) {
            const newCityRef = refreshedCity[0].Ref;
            console.log('[NovaPoshta] getPostomats: got new cityRef:', newCityRef);
            return this.getPostomats(newCityRef);
          }
        }
        
        return [];
      }

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
