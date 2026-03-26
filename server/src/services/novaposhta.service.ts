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
   * ✅ 1️⃣ ПОШУК МІСТА - ВИПРАВЛЕНО
   * - Використовуємо SettlementName для пошуку
   * - Отримуємо Ref з відповіді API
   * - Повне логіювання всіх відповідей
   * - Fallback на getSettlements якщо searchSettlements не працює
   */
  async searchCities(cityName: string): Promise<City[]> {
    if (!cityName || cityName.trim().length < 2) {
      console.log('[NovaPoshta] searchCities: empty query, returning []');
      return [];
    }

    const trimmedCityName = cityName.trim();
    console.log('='.repeat(60));
    console.log('[NovaPoshta] searchCities: START');
    console.log('[NovaPoshta] searchCities: searching for:', trimmedCityName);

    try {
      // ✅ ВИКОРИСТОВУЄМО searchSettlements - пошук за назвою населеного пункту
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          SettlementName: trimmedCityName,  // ✅ Шукаємо за назвою, не за повним описом
          Limit: 10,
        },
      };

      console.log('[NovaPoshta] searchCities: Request:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ДЕТАЛЬНЕ ЛОГУВАННЯ ВІДПОВІДІ
      console.log('[NovaPoshta] searchCities: RAW RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log('[NovaPoshta] searchCities: success:', response.data.success);
      console.log('[NovaPoshta] searchCities: errors:', response.data.errors || 'none');
      console.log('[NovaPoshta] searchCities: data type:', typeof response.data.data);
      console.log('[NovaPoshta] searchCities: data isArray:', Array.isArray(response.data.data));

      // ✅ ПЕРЕВІРКА ПОМИЛОК API
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] searchCities: API returned errors:', response.data.errors);
        return [];
      }

      if (!response.data.success) {
        console.error('[NovaPoshta] searchCities: API returned success: false');
        return [];
      }

      // ✅ ОТРИМУЄМО ДАНІ МІСТ - ОБРОБКА ВСІХ МОЖЛИВИХ ФОРМАТІВ
      let citiesData: any[] = [];

      // Структура відповіді searchSettlements: data[0].settlements
      if (response.data.data?.[0]?.settlements && Array.isArray(response.data.data[0].settlements)) {
        citiesData = response.data.data[0].settlements;
        console.log('[NovaPoshta] searchCities: Found settlements array:', citiesData.length, 'items');
      }
      // Альтернативна структура: data[0].Settlements
      else if (response.data.data?.[0]?.Settlements && Array.isArray(response.data.data[0].Settlements)) {
        citiesData = response.data.data[0].Settlements;
        console.log('[NovaPoshta] searchCities: Found Settlements (capital S):', citiesData.length, 'items');
      }
      // Прямий масив у data[0]
      else if (Array.isArray(response.data.data) && response.data.data.length > 0 && response.data.data[0].Ref) {
        citiesData = response.data.data;
        console.log('[NovaPoshta] searchCities: Found direct data array:', citiesData.length, 'items');
      }

      // ✅ FALLBACK: Якщо searchSettlements не дав результатів, пробуємо getSettlements
      if (citiesData.length === 0) {
        console.log('[NovaPoshta] searchCities: No results from searchSettlements, trying getSettlements...');

        const fallbackRequestBody = {
          apiKey: NOVA_POSHTA_API_KEY,
          modelName: 'Address',
          calledMethod: 'getSettlements',
          methodProperties: {
            Limit: 500,  // Збільшуємо ліміт для кращого пошуку
          },
        };

        console.log('[NovaPoshta] searchCities: Fallback request:', JSON.stringify(fallbackRequestBody, null, 2));

        const fallbackResponse = await axios.post(
          NOVA_POSHTA_API_URL,
          fallbackRequestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('[NovaPoshta] searchCities: getSettlements RAW RESPONSE:', JSON.stringify(fallbackResponse.data, null, 2));

        if (fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
          const allSettlements = fallbackResponse.data.data;
          console.log('[NovaPoshta] searchCities: getSettlements returned', allSettlements.length, 'total settlements');

          // Фільтруємо за назвою міста (українська/російська)
          const lowerSearch = trimmedCityName.toLowerCase();
          citiesData = allSettlements.filter((s: any) => {
            const description = (s.Description || '').toLowerCase();
            const present = (s.Present || '').toLowerCase();
            const settlementName = (s.SettlementName || '').toLowerCase();
            const settlementNameRu = (s.SettlementNameRu || '').toLowerCase();
            
            return description.includes(lowerSearch) || 
                   present.includes(lowerSearch) || 
                   settlementName.includes(lowerSearch) ||
                   settlementNameRu.includes(lowerSearch);
          });

          console.log('[NovaPoshta] searchCities: getSettlements filtered to', citiesData.length, 'matching settlements');
        }
      }

      if (citiesData.length === 0) {
        console.warn('[NovaPoshta] searchCities: ❌ City not found for:', trimmedCityName);
        console.warn('[NovaPoshta] searchCities: Try searching in Ukrainian (e.g. "Київ" instead of "Kiev")');
        return [];
      }

      // ✅ ФОРМУЄМО РЕЗУЛЬТАТ - ВИКОРИСТОВУЄМО Ref ДЛЯ getWarehouses
      const cities = citiesData.map((settlement: any) => ({
        Ref: settlement.Ref,  // ✅ ЦЕЙ Ref ПОТРІБНО ПЕРЕДАВАТИ В getWarehouses/getPosts
        Description: settlement.Present || settlement.Description,
        RegionDescription: settlement.RegionDescription || '',
        AreaDescription: settlement.AreaDescription || '',
        DeliveryCity: settlement.DeliveryCity || false,
      }));

      console.log('[NovaPoshta] searchCities: ✅ Found', cities.length, 'cities');
      console.log('[NovaPoshta] searchCities: FIRST CITY Ref:', cities[0].Ref);
      console.log('[NovaPoshta] searchCities: FIRST CITY Description:', cities[0].Description);
      console.log('[NovaPoshta] searchCities: END');
      console.log('='.repeat(60));

      return cities;
    } catch (error: any) {
      console.error('[NovaPoshta] searchCities: ❌ ERROR:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] searchCities: Error response status:', error.response.status);
        console.error('[NovaPoshta] searchCities: Error response data:', error.response.data);
      }
      console.log('[NovaPoshta] searchCities: END (with error)');
      console.log('='.repeat(60));
      return [];
    }
  }

  /**
   * ✅ 2️⃣ ОТРИМАННЯ ВІДДІЛЕНЬ - ВИПРАВЛЕНО
   * - Передаємо КОРЕКТНИЙ Ref (короткий рядок, не довгу назву!)
   * - Повне логіювання відповіді API
   * - Fallback: якщо "City not found", шукаємо місто заново
   */
  async getWarehouses(cityRef: string, cityName: string): Promise<Warehouse[]> {
    console.log('='.repeat(60));
    console.log('[NovaPoshta] getWarehouses: START');
    console.log('[NovaPoshta] getWarehouses: cityRef:', cityRef);
    console.log('[NovaPoshta] getWarehouses: cityName:', cityName);

    // ✅ ПЕРЕВІРКА: Ref не повинен бути пустим
    if (!cityRef) {
      console.warn('[NovaPoshta] getWarehouses: ❌ Empty cityRef, returning []');
      console.log('[NovaPoshta] getWarehouses: END (empty cityRef)');
      console.log('='.repeat(60));
      return [];
    }

    // ✅ ПЕРЕВІРКА: якщо cityRef виглядає як довга назва (містить кому або дуже довгий)
    // Це означає що клієнт передав Description замість Ref
    if (cityRef.includes(',') || cityRef.length > 50) {
      console.warn('[NovaPoshta] getWarehouses: ⚠️ cityRef looks like a long description, not Ref!');
      console.warn('[NovaPoshta] getWarehouses: cityRef preview:', cityRef.substring(0, 60) + '...');
      
      if (cityName && cityName.trim()) {
        console.log('[NovaPoshta] getWarehouses: Attempting to find correct Ref by cityName...');
        const refreshedCity = await this.searchCities(cityName);
        if (refreshedCity.length > 0) {
          cityRef = refreshedCity[0].Ref;
          console.log('[NovaPoshta] getWarehouses: ✅ Got correct cityRef:', cityRef);
        } else {
          console.error('[NovaPoshta] getWarehouses: ❌ Cannot find city by name:', cityName);
          console.log('[NovaPoshta] getWarehouses: END (city not found)');
          console.log('='.repeat(60));
          return [];
        }
      } else {
        console.error('[NovaPoshta] getWarehouses: ❌ Invalid cityRef format and no cityName provided');
        console.log('[NovaPoshta] getWarehouses: END (invalid params)');
        console.log('='.repeat(60));
        return [];
      }
    }

    console.log('[NovaPoshta] getWarehouses: Using cityRef:', cityRef);

    try {
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,  // ✅ КОРЕКТНИЙ Ref міста
          Limit: 100,
        },
      };

      console.log('[NovaPoshta] getWarehouses: Request:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ДЕТАЛЬНЕ ЛОГУВАННЯ ВІДПОВІДІ
      console.log('[NovaPoshta] getWarehouses: RAW RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log('[NovaPoshta] getWarehouses: success:', response.data.success);
      console.log('[NovaPoshta] getWarehouses: errors:', response.data.errors || 'none');

      // ✅ ПЕРЕВІРКА ПОМИЛОК API
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getWarehouses: ❌ API errors:', response.data.errors);

        // ✅ FALLBACK: Якщо "City not found", шукаємо місто заново
        if (response.data.errors.some((e: string) => e.includes('City not found') || e.includes('Місто не знайдено'))) {
          console.warn('[NovaPoshta] getWarehouses: ⚠️ City not found, trying fallback search...');
          if (cityName && cityName.trim()) {
            const refreshedCity = await this.searchCities(cityName);
            if (refreshedCity.length > 0) {
              const newCityRef = refreshedCity[0].Ref;
              console.log('[NovaPoshta] getWarehouses: ✅ Got new cityRef:', newCityRef);
              console.log('[NovaPoshta] getWarehouses: Retrying with new cityRef...');
              const result = await this.getWarehouses(newCityRef, cityName);
              console.log('[NovaPoshta] getWarehouses: END (retry successful)');
              console.log('='.repeat(60));
              return result;
            }
          }
          console.error('[NovaPoshta] getWarehouses: ❌ Fallback search also failed');
        }
        console.log('[NovaPoshta] getWarehouses: END (API errors)');
        console.log('='.repeat(60));
        return [];
      }

      if (!response.data.success) {
        console.error('[NovaPoshta] getWarehouses: ❌ API returned success: false');
        console.log('[NovaPoshta] getWarehouses: END (success: false)');
        console.log('='.repeat(60));
        return [];
      }

      // ✅ ОТРИМУЄМО ВІДДІЛЕННЯ
      let data = response.data.data || [];

      if (!Array.isArray(data)) {
        console.warn('[NovaPoshta] getWarehouses: ⚠️ data is not an array:', typeof data);
        console.log('[NovaPoshta] getWarehouses: END (invalid data format)');
        console.log('='.repeat(60));
        return [];
      }

      console.log('[NovaPoshta] getWarehouses: ✅ Found', data.length, 'warehouses');

      if (data.length === 0) {
        console.warn('[NovaPoshta] getWarehouses: ⚠️ API returned empty array for cityRef:', cityRef);
        console.log('[NovaPoshta] getWarehouses: END (no warehouses)');
        console.log('='.repeat(60));
        return [];
      }

      // ✅ ЛОГУВАННЯ ПЕРШИХ КІЛЬКОХ ВІДДІЛЕНЬ ДЛЯ ПЕРЕВІРКИ
      console.log('[NovaPoshta] getWarehouses: Sample warehouses (first 3):');
      data.slice(0, 3).forEach((w: any, i: number) => {
        console.log(`  [${i}] Ref: ${w.Ref}, Number: ${w.Number}, Address: ${w.ShortAddress}`);
      });

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

      console.log('[NovaPoshta] getWarehouses: ✅ Total warehouses:', warehouses.length);
      console.log('[NovaPoshta] getWarehouses: END');
      console.log('='.repeat(60));

      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getWarehouses: ❌ ERROR:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] getWarehouses: Error response status:', error.response.status);
        console.error('[NovaPoshta] getWarehouses: Error response data:', error.response.data);
      }
      console.log('[NovaPoshta] getWarehouses: END (with error)');
      console.log('='.repeat(60));
      return [];
    }
  }

  /**
   * ✅ 3️⃣ ОТРИМАННЯ ПОШТОМАТІВ - ВИПРАВЛЕНО
   * - Використовуємо метод getPosts для почтоматів
   * - Повне логіювання відповіді API
   * - Fallback аналогічно до getWarehouses
   */
  async getPostomats(cityRef: string, cityName: string): Promise<Warehouse[]> {
    console.log('='.repeat(60));
    console.log('[NovaPoshta] getPostomats: START');
    console.log('[NovaPoshta] getPostomats: cityRef:', cityRef);
    console.log('[NovaPoshta] getPostomats: cityName:', cityName);

    // ✅ ПЕРЕВІРКА: Ref не повинен бути пустим
    if (!cityRef) {
      console.warn('[NovaPoshta] getPostomats: ❌ Empty cityRef, returning []');
      console.log('[NovaPoshta] getPostomats: END (empty cityRef)');
      console.log('='.repeat(60));
      return [];
    }

    // ✅ ПЕРЕВІРКА: якщо cityRef виглядає як довга назва
    if (cityRef.includes(',') || cityRef.length > 50) {
      console.warn('[NovaPoshta] getPostomats: ⚠️ cityRef looks like a long description, not Ref!');
      console.warn('[NovaPoshta] getPostomats: cityRef preview:', cityRef.substring(0, 60) + '...');
      
      if (cityName && cityName.trim()) {
        console.log('[NovaPoshta] getPostomats: Attempting to find correct Ref by cityName...');
        const refreshedCity = await this.searchCities(cityName);
        if (refreshedCity.length > 0) {
          cityRef = refreshedCity[0].Ref;
          console.log('[NovaPoshta] getPostomats: ✅ Got correct cityRef:', cityRef);
        } else {
          console.error('[NovaPoshta] getPostomats: ❌ Cannot find city by name:', cityName);
          console.log('[NovaPoshta] getPostomats: END (city not found)');
          console.log('='.repeat(60));
          return [];
        }
      } else {
        console.error('[NovaPoshta] getPostomats: ❌ Invalid cityRef format and no cityName provided');
        console.log('[NovaPoshta] getPostomats: END (invalid params)');
        console.log('='.repeat(60));
        return [];
      }
    }

    console.log('[NovaPoshta] getPostomats: Using cityRef:', cityRef);

    try {
      // ✅ ВИКОРИСТОВУЄМО getPosts - окремий метод для почтоматів
      const requestBody = {
        apiKey: NOVA_POSHTA_API_KEY,
        modelName: 'Address',
        calledMethod: 'getPosts',
        methodProperties: {
          CityRef: cityRef,
          Limit: 100,
        },
      };

      console.log('[NovaPoshta] getPostomats: Request:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        NOVA_POSHTA_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // ✅ ДЕТАЛЬНЕ ЛОГУВАННЯ ВІДПОВІДІ
      console.log('[NovaPoshta] getPostomats: RAW RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log('[NovaPoshta] getPostomats: success:', response.data.success);
      console.log('[NovaPoshta] getPostomats: errors:', response.data.errors || 'none');

      // ✅ ПЕРЕВІРКА ПОМИЛОК API
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[NovaPoshta] getPostomats: ❌ API errors:', response.data.errors);

        // ✅ FALLBACK
        if (response.data.errors.some((e: string) => e.includes('City not found') || e.includes('Місто не знайдено'))) {
          console.warn('[NovaPoshta] getPostomats: ⚠️ City not found, trying fallback search...');
          if (cityName && cityName.trim()) {
            const refreshedCity = await this.searchCities(cityName);
            if (refreshedCity.length > 0) {
              const newCityRef = refreshedCity[0].Ref;
              console.log('[NovaPoshta] getPostomats: ✅ Got new cityRef:', newCityRef);
              console.log('[NovaPoshta] getPostomats: Retrying with new cityRef...');
              const result = await this.getPostomats(newCityRef, cityName);
              console.log('[NovaPoshta] getPostomats: END (retry successful)');
              console.log('='.repeat(60));
              return result;
            }
          }
          console.error('[NovaPoshta] getPostomats: ❌ Fallback search also failed');
        }
        console.log('[NovaPoshta] getPostomats: END (API errors)');
        console.log('='.repeat(60));
        return [];
      }

      if (!response.data.success) {
        console.error('[NovaPoshta] getPostomats: ❌ API returned success: false');
        console.log('[NovaPoshta] getPostomats: END (success: false)');
        console.log('='.repeat(60));
        return [];
      }

      // ✅ ОТРИМУЄМО ПОШТОМАТИ
      let data = response.data.data || [];

      if (!Array.isArray(data)) {
        console.warn('[NovaPoshta] getPostomats: ⚠️ data is not an array:', typeof data);
        console.log('[NovaPoshta] getPostomats: END (invalid data format)');
        console.log('='.repeat(60));
        return [];
      }

      console.log('[NovaPoshta] getPostomats: ✅ Found', data.length, 'postomats');

      if (data.length === 0) {
        console.warn('[NovaPoshta] getPostomats: ⚠️ API returned empty array for cityRef:', cityRef);
        console.log('[NovaPoshta] getPostomats: END (no postomats)');
        console.log('='.repeat(60));
        return [];
      }

      // ✅ ЛОГУВАННЯ ПЕРШИХ КІЛЬКОХ ПОШТОМАТІВ
      console.log('[NovaPoshta] getPostomats: Sample postomats (first 3):');
      data.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`  [${i}] Ref: ${p.Ref}, Number: ${p.Number}, Address: ${p.ShortAddress || p.Address}`);
      });

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

      console.log('[NovaPoshta] getPostomats: ✅ Total postomats:', warehouses.length);
      console.log('[NovaPoshta] getPostomats: END');
      console.log('='.repeat(60));

      return warehouses;
    } catch (error: any) {
      console.error('[NovaPoshta] getPostomats: ❌ ERROR:', error.message);
      if (error.response) {
        console.error('[NovaPoshta] getPostomats: Error response status:', error.response.status);
        console.error('[NovaPoshta] getPostomats: Error response data:', error.response.data);
      }
      console.log('[NovaPoshta] getPostomats: END (with error)');
      console.log('='.repeat(60));
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
