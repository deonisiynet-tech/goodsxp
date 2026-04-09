import axios from "axios";

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY;
if (!API_KEY) {
  throw new Error('NOVA_POSHTA_API_KEY не налаштовано. Встановіть змінну оточення.');
}

console.log("[NovaPoshta] Service initialized with API Key:", API_KEY ? "YES" : "NO");

/**
 * ✅ ПОШУК МІСТ - ПРАВИЛЬНА ЛОГІКА
 * 
 * Використовуємо searchSettlements → отримуємо Addresses → беремо DeliveryCity як Ref
 * 
 * @param query - Назва міста (українською або російською)
 * @returns Масив міст з label (Present) та cityRef (DeliveryCity)
 */
export async function searchCities(query: string) {
  console.log("[NovaPoshta] searchCities: START, query:", query);

  if (!query || query.trim().length < 2) {
    console.log("[NovaPoshta] searchCities: query too short, returning []");
    return [];
  }

  try {
    const response = await axios.post(API_URL, {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "searchSettlements",
      methodProperties: {
        SettlementName: query.trim(),  // ✅ Шукаємо за назвою населеного пункту
        Limit: 20,
      },
    });

    console.log("[NovaPoshta] searchCities: RAW response:", JSON.stringify(response.data, null, 2));

    // ✅ ОТРИМУЄМО МІСТА З ВІДПОВІДІ
    // Структура: response.data.data[0].Addresses
    const addresses = response.data.data?.[0]?.Addresses || [];
    
    console.log("[NovaPoshta] searchCities: Found", addresses.length, "addresses");

    if (addresses.length === 0) {
      console.log("[NovaPoshta] searchCities: No addresses found");
      return [];
    }

    // ✅ ПЕРЕТВОРЮЄМО У ЗРУЧНИЙ ФОРМАТ
    const cities = addresses.map((city: any) => ({
      label: city.Present || city.Description,  // ✅ Коротка назва для відображення
      cityRef: city.DeliveryCity,               // ✅ Ref міста для getWarehouses
      description: city.Description,
      region: city.RegionDescription,
      area: city.AreaDescription,
    }));

    console.log("[NovaPoshta] searchCities: END, found", cities.length, "cities");
    console.log("[NovaPoshta] searchCities: First city:", cities[0]);

    return cities;
  } catch (error: any) {
    console.error("[NovaPoshta] searchCities: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta] searchCities: Error response:", error.response.data);
    }
    return [];
  }
}

/**
 * ✅ ОТРИМАННЯ ВІДДІЛЕНЬ - ПРАВИЛЬНА ЛОГІКА
 * 
 * Використовуємо CityRef (DeliveryCity) з попереднього запиту
 * 
 * @param cityRef - Ref міста з searchCities (DeliveryCity)
 * @returns Масив відділень з Ref, Description, Number
 */
export async function getWarehouses(cityRef: string) {
  console.log("[NovaPoshta] getWarehouses: START, cityRef:", cityRef);

  if (!cityRef) {
    console.log("[NovaPoshta] getWarehouses: empty cityRef, returning []");
    return [];
  }

  try {
    const response = await axios.post(API_URL, {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: cityRef,  // ✅ Використовуємо DeliveryCity з searchCities
        Limit: 100,
      },
    });

    console.log("[NovaPoshta] getWarehouses: RAW response:", JSON.stringify(response.data, null, 2));

    // ✅ ПЕРЕВІРКА ПОМИЛОК API
    if (response.data.errors && response.data.errors.length > 0) {
      console.error("[NovaPoshta] getWarehouses: API errors:", response.data.errors);
      
      // Якщо "City not found" - можливо передано неправильний Ref
      if (response.data.errors.some((e: string) => e.includes("City not found") || e.includes("Місто не знайдено"))) {
        console.error("[NovaPoshta] getWarehouses: City not found. Check if cityRef is correct DeliveryCity value");
      }
      
      return [];
    }

    if (!response.data.success) {
      console.error("[NovaPoshta] getWarehouses: API returned success: false");
      return [];
    }

    const warehouses = response.data.data || [];
    console.log("[NovaPoshta] getWarehouses: Found", warehouses.length, "warehouses");

    if (warehouses.length === 0) {
      console.log("[NovaPoshta] getWarehouses: No warehouses found for this city");
      return [];
    }

    // ✅ ПЕРЕТВОРЮЄМО У ЗРУЧНИЙ ФОРМАТ
    const result = warehouses.map((w: any) => ({
      id: w.Ref,
      label: w.Description,
      number: w.Number,
      shortAddress: w.ShortAddress,
      type: w.TypeOfWarehouse || "Відділення",
      latitude: w.Latitude,
      longitude: w.Longitude,
      schedule: w.Schedule,
    }));

    console.log("[NovaPoshta] getWarehouses: END, found", result.length, "warehouses");
    console.log("[NovaPoshta] getWarehouses: First warehouse:", result[0]);

    return result;
  } catch (error: any) {
    console.error("[NovaPoshta] getWarehouses: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta] getWarehouses: Error response:", error.response.data);
    }
    return [];
  }
}

/**
 * ✅ ОТРИМАННЯ ПОШТОМАТІВ
 * 
 * Використовуємо метод getPosts для почтоматів
 * 
 * @param cityRef - Ref міста з searchCities (DeliveryCity)
 * @returns Масив почтоматів
 */
export async function getPostomats(cityRef: string) {
  console.log("[NovaPoshta] getPostomats: START, cityRef:", cityRef);

  if (!cityRef) {
    console.log("[NovaPoshta] getPostomats: empty cityRef, returning []");
    return [];
  }

  try {
    const response = await axios.post(API_URL, {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "getPosts",  // ✅ Окремий метод для почтоматів
      methodProperties: {
        CityRef: cityRef,
        Limit: 100,
      },
    });

    console.log("[NovaPoshta] getPostomats: RAW response:", JSON.stringify(response.data, null, 2));

    // ✅ ПЕРЕВІРКА ПОМИЛОК API
    if (response.data.errors && response.data.errors.length > 0) {
      console.error("[NovaPoshta] getPostomats: API errors:", response.data.errors);
      return [];
    }

    if (!response.data.success) {
      console.error("[NovaPoshta] getPostomats: API returned success: false");
      return [];
    }

    const postomats = response.data.data || [];
    console.log("[NovaPoshta] getPostomats: Found", postomats.length, "postomats");

    if (postomats.length === 0) {
      console.log("[NovaPoshta] getPostomats: No postomats found for this city");
      return [];
    }

    // ✅ ПЕРЕТВОРЮЄМО У ЗРУЧНИЙ ФОРМАТ
    const result = postomats.map((p: any) => ({
      id: p.Ref,
      label: p.Description,
      number: p.Number,
      shortAddress: p.ShortAddress || p.Address,
      type: "Почтомат",
      latitude: p.Latitude,
      longitude: p.Longitude,
      schedule: "24/7",
    }));

    console.log("[NovaPoshta] getPostomats: END, found", result.length, "postomats");
    console.log("[NovaPoshta] getPostomats: First postomat:", result[0]);

    return result;
  } catch (error: any) {
    console.error("[NovaPoshta] getPostomats: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta] getPostomats: Error response:", error.response.data);
    }
    return [];
  }
}

/**
 * ✅ ОТРИМАННЯ ВСІХ ТИПІВ ДОСТАВКИ ОДНОЧАСНО
 * 
 * @param cityRef - Ref міста
 * @returns Об'єкт з warehouses та postomats
 */
export async function getAllDeliveryOptions(cityRef: string) {
  console.log("[NovaPoshta] getAllDeliveryOptions: START, cityRef:", cityRef);

  const [warehouses, postomats] = await Promise.all([
    getWarehouses(cityRef),
    getPostomats(cityRef),
  ]);

  console.log("[NovaPoshta] getAllDeliveryOptions: warehouses:", warehouses.length, "postomats:", postomats.length);

  return { warehouses, postomats };
}
