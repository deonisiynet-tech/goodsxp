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
  DeliveryCity?: boolean;
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
  /**
   * ✅ 1️⃣ ПОШУК МІСТА
   * - Логіювання всього відповіді API
   * - Вибір першого результату
   * - Витяг Ref для getWarehouses
   * - ПІДТРИМКА РОСІЙСЬКОЇ ТА УКРАЇНСЬКОЇ МОВИ
   */
  async searchCities(cityName: string): Promise<City[]> {
    if (!cityName || cityName.trim().length < 2) {
      console.log('[NovaPoshta] searchCities: empty query, returning []');
      return [];
    }

    const trimmedCityName = cityName.trim();
    console.log('[NovaPoshta] searchCities: searching for', trimmedCityName);

    try {
      // ✅ СПОЧАТКУ ПРОБУЄМО searchSettlements (універсальний пошук)
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          SettlementName: trimmedCityName,
          Limit: 10,
        },
      };

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ЛОГУВАННЯ ВСЬОГО ВІДПОВІДІ API
      console.log('[NovaPoshta] Cities FULL RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log('[NovaPoshta] Cities response.data type:', typeof response.data.data);
      console.log('[NovaPoshta] Cities response.data isArray:', Array.isArray(response.data.data));

      // ✅ ЛОГУВАННЯ ПОМИЛОК API
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] searchCities API errors:', response.data.errors);
        console.error('[NovaPoshta] searchCities FULL ERROR RESPONSE:', JSON.stringify(response.data, null, 2));
        return [];
      }

      if (!response.data.success) {
        console.error('[NovaPoshta] searchCities API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО МІСТА - ПЕРЕВІРЯЄМО ВСІ МОЖЛИВІ ФОРМАТИ
      let citiesData: any[] = [];

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
      // Варіант 3: data[0] - масив з об'єктами міст (без вкладеності)
      else if (Array.isArray(response.data.data) && response.data.data.length > 0 && response.data.data[0].Ref) {
        citiesData = response.data.data;
        console.log('[NovaPoshta] searchCities: found direct data array:', citiesData.length);
      }
      // Варіант 4: data - масив
      else if (Array.isArray(response.data.data)) {
        citiesData = response.data.data;
        console.log('[NovaPoshta] searchCities: found data array:', citiesData.length);
      }
      // ✅ НОВИЙ ВАРИАНТ: data[0] - об'єкт з полем Settlements (велика літера)
      else if (response.data.data?.[0]?.Settlements) {
        citiesData = response.data.data[0].Settlements;
        console.log('[NovaPoshta] searchCities: found Settlements (capital S):', citiesData.length);
      }

      // ✅ ЯКЩО ПЕРШИЙ ЗАПИТ НЕ ВДАВСЯ - ПРОБУЄМО getSettlements
      if (citiesData.length === 0) {
        console.log('[NovaPoshta] searchCities: first attempt failed, trying getSettlements...');
        
        const fallbackRequestBody = {
          apiKey: NOVA_POSHTA_API_KEY,
          modelName: 'Address',
          calledMethod: 'getSettlements',
          methodProperties: {
            Limit: 100,
          },
        };

        const fallbackResponse = await axios.post(
          NOVA_POSHTA_API_URL,
          fallbackRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('[NovaPoshta] getSettlements FULL RESPONSE:', JSON.stringify(fallbackResponse.data, null, 2));

        if (fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
          const allSettlements = fallbackResponse.data.data;
          console.log('[NovaPoshta] getSettlements: got', allSettlements.length, 'settlements');
          
          // Фільтруємо за назвою міста (українська або російська)
          const lowerSearch = trimmedCityName.toLowerCase();
          citiesData = allSettlements.filter((s: any) => {
            const description = (s.Description || '').toLowerCase();
            const present = (s.Present || '').toLowerCase();
            // Також перевіряємо російську назву
            const settlementNameRu = (s.SettlementNameRu || '').toLowerCase();
            return description.includes(lowerSearch) || present.includes(lowerSearch) || settlementNameRu.includes(lowerSearch);
          });
          
          console.log('[NovaPoshta] getSettlements: filtered to', citiesData.length, 'matching settlements');
        }
      }

      if (citiesData.length === 0) {
        console.warn('[NovaPoshta] searchCities: Місто не знайдено');
        console.warn('[NovaPoshta] searchCities: Try searching in Ukrainian language');
        console.warn('[NovaPoshta] searchCities: Full data structure:', JSON.stringify(response.data.data, null, 2));
        return [];
      }

      // ✅ БЕРЕМО ПЕРШИЙ РЕЗУЛЬТАТ - витягуємо Ref
      const cities = citiesData.map((settlement: any) => ({
        Ref: settlement.Ref,  // ✅ САМЕ ЦЕ ПОЛЕ ПОТРІБНЕ ДЛЯ getWarehouses
        Description: settlement.Present || settlement.Description,
        RegionDescription: settlement.RegionDescription || '',
        AreaDescription: settlement.AreaDescription || '',
        DeliveryCity: settlement.DeliveryCity || false,
      }));

      console.log('[NovaPoshta] searchCities: found', cities.length, 'cities');
      console.log('[NovaPoshta] searchCities: FIRST CITY Ref:', cities[0].Ref);
      console.log('[NovaPoshta] searchCities: FIRST CITY Description:', cities[0].Description);
      
      return cities;
    } catch (error: any) {
      console.error('[NovaPoshta] searchCities error:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] searchCities Error response:', error.response.data);
      }
      return [];
    }
  }

  /**
   * ✅ 2️⃣ ОТРИМАННЯ ВІДДІЛЕНЬ
   * - Передаємо КОРЕКТНИЙ Ref (не довгу назву!)
   * - Fallback: якщо "City not found", шукаємо місто заново
   */
  async getWarehouses(cityRef: string, cityName: string): Promise<Warehouse[]> {
    // ✅ ПЕРЕВІРКА: Ref не повинен бути пустим або довгою назвою
    if (!cityRef) {
      console.log('[NovaPoshta] getWarehouses: empty cityRef, returning []');
      return [];
    }

    // ✅ ПЕРЕВІРКА: якщо cityRef містить коми - це довга назва, а не Ref!
    if (cityRef.includes(',') || cityRef.length > 50) {
      console.warn('[NovaPoshta] getWarehouses: cityRef looks like a long name, not Ref:', cityRef.substring(0, 50) + '...');
      console.warn('[NovaPoshta] getWarehouses: trying to search city by name:', cityName);
      
      // Шукаємо місто за назвою
      const refreshedCity = await this.searchCities(cityName);
      if (refreshedCity.length > 0) {
        cityRef = refreshedCity[0].Ref;  // ✅ БЕРЕМУ ПРАВИЛЬНИЙ Ref
        console.log('[NovaPoshta] getWarehouses: got correct cityRef:', cityRef);
      } else {
        console.error('[NovaPoshta] getWarehouses: cannot find city by name:', cityName);
        return [];
      }
    }

    console.log('[NovaPoshta] getWarehouses: loading for cityRef', cityRef, 'cityName:', cityName);

    try {
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',  // ✅ Address, не AddressGeneral
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,  // ✅ КОРЕКТНИЙ Ref
          Limit: 100,
        },
      };

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ЛОГУВАННЯ ВСЬОГО ВІДПОВІДІ API
      console.log('[NovaPoshta] Warehouses FULL RESPONSE:', JSON.stringify(response.data, null, 2));

      // ✅ ЛОГУВАННЯ ПОМИЛОК API
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getWarehouses API errors:', response.data.errors);
        console.error('[NovaPoshta] getWarehouses FULL ERROR RESPONSE:', JSON.stringify(response.data, null, 2));

        // ✅ FALLBACK: Якщо "City not found", шукаємо місто заново
        if (response.data.errors.includes('City not found')) {
          console.warn('[NovaPoshta] getWarehouses: City not found, trying fallback...');
          const refreshedCity = await this.searchCities(cityName);
          if (refreshedCity.length > 0) {
            const newCityRef = refreshedCity[0].Ref;  // ✅ БЕРЕМУ НОВИЙ Ref
            console.log('[NovaPoshta] getWarehouses: got new cityRef:', newCityRef);
            return this.getWarehouses(newCityRef, cityName);  // ✅ РЕКУРСІЯ
          }
        }

        return [];
      }

      if (!response.data.success) {
        console.error('[NovaPoshta] getWarehouses API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ВІДДІЛЕННЯ
      let data = response.data.data || [];
      
      if (!Array.isArray(data)) {
        console.warn('[NovaPoshta] getWarehouses: data is not an array');
        return [];
      }

      console.log('[NovaPoshta] getWarehouses: found', data.length, 'warehouses');

      if (data.length === 0) {
        console.warn('[NovaPoshta] getWarehouses: API повернув пустий масив для cityRef:', cityRef);
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
      console.log('[NovaPoshta] getWarehouses: перші 3 відділення:', warehouses.slice(0, 3));
      
      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getWarehouses ERROR:', error);
      if (error.response) {
        console.error('[NovaPoshta] getWarehouses Error response:', error.response.data);
      }
      return [];
    }
  }

  /**
   * ✅ 3️⃣ ОТРИМАННЯ ПОШТОМАТІВ
   * - Використовуємо метод getPosts для почтоматів
   * - Аналогічна логіка до getWarehouses з fallback
   */
  async getPostomats(cityRef: string, cityName: string): Promise<Warehouse[]> {
    // ✅ ПЕРЕВІРКА: Ref не повинен бути пустим або довгою назвою
    if (!cityRef) {
      console.log('[NovaPoshta] getPostomats: empty cityRef, returning []');
      return [];
    }

    // ✅ ПЕРЕВІРКА: якщо cityRef містить коми - це довга назва
    if (cityRef.includes(',') || cityRef.length > 50) {
      console.warn('[NovaPoshta] getPostomats: cityRef looks like a long name, not Ref');
      const refreshedCity = await this.searchCities(cityName);
      if (refreshedCity.length > 0) {
        cityRef = refreshedCity[0].Ref;
        console.log('[NovaPoshta] getPostomats: got correct cityRef:', cityRef);
      } else {
        return [];
      }
    }

    console.log('[NovaPoshta] getPostomats: loading for cityRef', cityRef, 'cityName:', cityName);

    try {
      // ✅ ВИКОРИСТОВУЄМО getPosts - окремий метод для почтоматів
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'getPosts',  // ✅ ОКРЕМИЙ МЕТОД ДЛЯ ПОШТОМАТІВ
        methodProperties: {
          CityRef: cityRef,
          Limit: 100,
        },
      };

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ЛОГУВАННЯ ВСЬОГО ВІДПОВІДІ API
      console.log('[NovaPoshta] Postomats FULL RESPONSE:', JSON.stringify(response.data, null, 2));

      // ✅ ЛОГУВАННЯ ПОМИЛОК API
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getPostomats API errors:', response.data.errors);
        console.error('[NovaPoshta] getPostomats FULL ERROR RESPONSE:', JSON.stringify(response.data, null, 2));

        // ✅ FALLBACK
        if (response.data.errors.includes('City not found')) {
          console.warn('[NovaPoshta] getPostomats: City not found, trying fallback...');
          const refreshedCity = await this.searchCities(cityName);
          if (refreshedCity.length > 0) {
            const newCityRef = refreshedCity[0].Ref;
            console.log('[NovaPoshta] getPostomats: got new cityRef:', newCityRef);
            return this.getPostomats(newCityRef, cityName);
          }
        }

        return [];
      }

      if (!response.data.success) {
        console.error('[NovaPoshta] getPostomats API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ПОШТОМАТИ
      let data = response.data.data || [];

      if (!Array.isArray(data)) {
        console.warn('[NovaPoshta] getPostomats: data is not an array');
        return [];
      }

      console.log('[NovaPoshta] getPostomats: found', data.length, 'postomats');

      if (data.length === 0) {
        console.warn('[NovaPoshta] getPostomats: API повернув пустий масив');
        return [];
      }

      const warehouses = data.map((warehouse: any) => ({
        Ref: warehouse.Ref,
        Description: warehouse.Description,
        ShortAddress: warehouse.ShortAddress || warehouse.Address,
        Number: warehouse.Number,
        Latitude: warehouse.Latitude,
        Longitude: warehouse.Longitude,
        Type: 'Почтомат',
        Schedule: '24/7',
      }));

      console.log('[NovaPoshta] getPostomats: знайдено', warehouses.length, 'почтоматів');

      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getPostomats ERROR:', error);
      if (error.response) {
        console.error('[NovaPoshta] getPostomats Error response:', error.response.data);
      }
      return [];
    }
  }

  /**
   * ✅ 4️⃣ ОТРИМАННЯ ВСІХ ТИПІВ ДОСТАВКИ
   * - Warehouse + Postomat одночасно
   * - Для відображення на сайті
   */
  async getAllDeliveryOptions(cityRef: string, cityName: string): Promise<{warehouses: Warehouse[], postomats: Warehouse[]}> {
    console.log('[NovaPoshta] getAllDeliveryOptions: loading for cityRef', cityRef, 'cityName:', cityName);

    // ✅ Перевіряємо всі типи відділень одночасно
    const [warehouses, postomats] = await Promise.all([
      this.getWarehouses(cityRef, cityName),
      this.getPostomats(cityRef, cityName),
    ]);

    console.log('[NovaPoshta] getAllDeliveryOptions: total warehouses:', warehouses.length, 'postomats:', postomats.length);

    return { warehouses, postomats };
  }
}
