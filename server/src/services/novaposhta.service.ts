import axios from 'axios';

const NOVA_POSHTA_API_KEY = process.env.NOVA_POSHTA_API_KEY || 'e4f31f08818aa6c445cb9a73f1e787cd';
const NOVA_POSHTA_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

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

    return response.data.data[0] as T;
  }

  async searchCities(searchQuery: string): Promise<City[]> {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const data = await this.makeRequest<any>(
      'Address',
      'searchSettlements',
      {
        searchString: searchQuery.trim(),
      }
    );

    return data.settlements?.map((settlement: any) => ({
      Ref: settlement.Ref,
      Description: settlement.Description,
      RegionDescription: settlement.RegionDescription,
      AreaDescription: settlement.AreaDescription,
    })) || [];
  }

  async getWarehouses(cityRef: string): Promise<Warehouse[]> {
    if (!cityRef) {
      return [];
    }

    const data = await this.makeRequest<Warehouse[]>(
      'Address',
      'getWarehouses',
      {
        CityRef: cityRef,
      }
    );

    return data.map((warehouse: any) => ({
      Ref: warehouse.Ref,
      Description: warehouse.Description,
      ShortAddress: warehouse.ShortAddress,
      Number: warehouse.Number,
      Latitude: warehouse.Latitude,
      Longitude: warehouse.Longitude,
    }));
  }
}
