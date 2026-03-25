import axios from 'axios';

const NOVA_POSHTA_API_KEY = process.env.NOVA_POSHTA_API_KEY || 'fd61dad0d97e5d3479d7f3164b54b03f';
const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

console.log('[NovaPoshta] API Key configured:', NOVA_POSHTA_API_KEY ? 'YES' : 'NO');
console.log('[NovaPoshta] API URL:', NOVA_POSHTA_API_URL);

interface NovaPoshtaRequest {
  apiKey: string;
  modelName: string;
  calledMethod: string;
  methodProperties?: Record<string, any>;
}

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
  private async makeRequest<T>(modelName: string, calledMethod: string, methodProperties?: Record<string, any>): Promise<T> {
    const request: NovaPoshtaRequest = {
      apiKey: NOVA_POSHTA_API_KEY,
      modelName,
      calledMethod,
      methodProperties,
    };

    const response = await axios.post(NOVA_POSHTA_API_URL, request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.errors && response.data.errors.length > 0) {
      throw new Error(response.data.errors.join(', '));
    }

    if (response.data.success && response.data.data) {
      return response.data.data as T;
    }

    return response.data.data[0] as T;
  }

  async searchCities(searchQuery: string): Promise<City[]> {
    if (!searchQuery || searchQuery.trim().length < 2) {
      console.log('[NovaPoshta] searchCities: empty query, returning []');
      return [];
    }

    console.log('[NovaPoshta] searchCities: searching for', searchQuery);

    try {
      const data = await this.makeRequest<any>(
        'Address',
        'searchSettlements',
        {
          searchString: searchQuery.trim(),
        }
      );

      console.log('[NovaPoshta] searchCities: raw response', JSON.stringify(data, null, 2));

      const cities = data.settlements?.map((settlement: any) => ({
        Ref: settlement.Ref,
        Description: settlement.Description,
        RegionDescription: settlement.RegionDescription,
        AreaDescription: settlement.AreaDescription,
      })) || [];

      console.log('[NovaPoshta] searchCities: found', cities.length, 'cities');
      return cities;
    } catch (error: any) {
      console.error('[NovaPoshta] searchCities error:', error.message);
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
      const data = await this.makeRequest<Warehouse[]>(
        'Address',
        'getWarehouses',
        {
          CityRef: cityRef,
        }
      );

      console.log('[NovaPoshta] getWarehouses: raw response', JSON.stringify(data, null, 2));

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
      return [];
    }
  }

  async getPostomats(cityRef: string): Promise<Warehouse[]> {
    if (!cityRef) {
      return [];
    }

    const data = await this.makeRequest<Warehouse[]>(
      'Address',
      'getWarehouses',
      {
        CityRef: cityRef,
        TypeOfWarehouseRef: 'd904c7aa-4c45-4275-a111-99643895928b', // Почтомат
      }
    );

    return data.map((warehouse: any) => ({
      Ref: warehouse.Ref,
      Description: warehouse.Description,
      ShortAddress: warehouse.ShortAddress,
      Number: warehouse.Number,
      Latitude: warehouse.Latitude,
      Longitude: warehouse.Longitude,
      Type: 'Почтомат',
      Schedule: '24/7',
    }));
  }
}
