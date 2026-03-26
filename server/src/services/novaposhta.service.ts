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
      // ✅ ВИКОРИСТОВУЄМО ПРАВИЛЬНІ ПАРАМЕТРИ ЗГІДНО З API NOVA POSHTA
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          SettlementName: cityName.trim(),  // ✅ ПРАВИЛЬНА НАЗВА ПАРАМЕТРА
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

      // searchSettlements повертає { settlements: [...] } в data[0]
      const settlementsData = response.data.data?.[0];
      console.log('[NovaPoshta] settlementsData:', JSON.stringify(settlementsData, null, 2));
      
      if (!settlementsData || !settlementsData.settlements) {
        console.log('[NovaPoshta] searchCities: no settlements found in response');
        console.log('[NovaPoshta] Available keys:', Object.keys(response.data.data?.[0] || {}));
        return [];
      }

      const cities = settlementsData.settlements.map((settlement: any) => ({
        Ref: settlement.Ref,
        Description: settlement.Description,
        RegionDescription: settlement.RegionDescription,
        AreaDescription: settlement.AreaDescription,
      }));

      console.log('[NovaPoshta] searchCities: found', cities.length, 'cities');
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
      // ✅ ВИКОРИСТОВУЄМО ПРАВИЛЬНУ МОДЕЛЬ AddressGeneral
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'AddressGeneral',  // ✅ ПРАВИЛЬНА МОДЕЛЬ
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
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

      console.log('[NovaPoshta] getWarehouses response:', JSON.stringify(response.data, null, 2));

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getWarehouses API errors:', response.data.errors);
        return [];
      }

      const data = response.data.data || [];

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

      console.log('[NovaPoshta] getWarehouses: found', warehouses.length, 'warehouses');
      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getWarehouses error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] Error response:', error.response.data);
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
          TypeOfWarehouseRef: 'd904c7aa-4c45-4275-a111-99643895928b', // Почтомат
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

      console.log('[NovaPoshta] getPostomats response:', JSON.stringify(response.data, null, 2));

      // Перевіряємо наявність помилок
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getPostomats API errors:', response.data.errors);
        return [];
      }

      const data = response.data.data || [];

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

      console.log('[NovaPoshta] getPostomats: found', warehouses.length, 'postomats');
      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getPostomats error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] Error response:', error.response.data);
      }
      return [];
    }
  }
}
