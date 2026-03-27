import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY || "fd61dad0d97e5d3479d7f3164b54b03f";

console.log("[NovaPoshta Routes] Initialized with API Key:", API_KEY ? "YES" : "NO");

/**
 * ✅ POST /api/nova-poshta/cities
 * Пошук міст за назвою
 * 
 * УВАГА: searchSettlements може не працювати з тестовим API ключем
 * Використовуємо getSettlements з фільтрацією як fallback
 */
router.post('/cities', async (req: Request, res: Response) => {
  try {
    const { city } = req.body;

    console.log("[NovaPoshta API] /cities: START, city:", city);

    if (!city || city.trim().length < 2) {
      console.log("[NovaPoshta API] /cities: query too short");
      return res.json([]);
    }

    const searchQuery = city.trim().toLowerCase();
    
    // ✅ СПРОБА 1: searchSettlements (може не працювати з тестовим ключем)
    let addresses = [];
    
    try {
      const searchResponse = await axios.post(API_URL, {
        apiKey: API_KEY,
        modelName: "Address",
        calledMethod: "searchSettlements",
        methodProperties: {
          SettlementName: searchQuery,
          Limit: 20,
        },
      });

      const searchData = searchResponse.data;
      console.log("[NovaPoshta API] /cities: searchSettlements response:", JSON.stringify(searchData, null, 2));

      // Перевіряємо відповідь searchSettlements
      if (searchData.data?.[0]?.Addresses && Array.isArray(searchData.data[0].Addresses)) {
        addresses = searchData.data[0].Addresses;
        console.log("[NovaPoshta API] /cities: Found Addresses from searchSettlements");
      }
    } catch (searchError) {
      console.log("[NovaPoshta API] /cities: searchSettlements failed, using getSettlements fallback");
    }

    // ✅ СПРОБА 2: getSettlements з фільтрацією (fallback)
    if (addresses.length === 0) {
      console.log("[NovaPoshta API] /cities: Using getSettlements fallback...");
      
      const getResponse = await axios.post(API_URL, {
        apiKey: API_KEY,
        modelName: "Address",
        calledMethod: "getSettlements",
        methodProperties: {
          Limit: 100,  // Обмежуємо для швидкості
        },
      });

      const getData = getResponse.data;
      console.log("[NovaPoshta API] /cities: getSettlements got", getData.data?.length, "total settlements");

      if (Array.isArray(getData.data)) {
        // Фільтруємо за назвою міста
        addresses = getData.data.filter((s: any) => {
          const description = (s.Description || "").toLowerCase();
          const descriptionRu = (s.DescriptionRu || "").toLowerCase();
          const translit = (s.DescriptionTranslit || "").toLowerCase();
          
          return description.includes(searchQuery) || 
                 descriptionRu.includes(searchQuery) || 
                 translit.includes(searchQuery);
        });
        
        console.log("[NovaPoshta API] /cities: Filtered to", addresses.length, "matching settlements");
      }
    }
    
    console.log("[NovaPoshta API] /cities: Total addresses found:", addresses.length);

    if (addresses.length === 0) {
      console.log("[NovaPoshta API] /cities: No addresses found");
      return res.json([]);
    }

    // ✅ Перетворюємо у зручний формат
    const cities = addresses.slice(0, 20).map((c: any) => ({
      label: c.Description || c.Present,
      cityRef: c.Ref,  // ✅ Використовуємо Ref з getSettlements
      description: c.Description,
      region: c.AreaDescription || c.RegionsDescription,
      area: c.SettlementTypeDescription,
    }));

    console.log("[NovaPoshta API] /cities: END, found", cities.length, "cities");
    console.log("[NovaPoshta API] /cities: First city:", cities[0]);

    res.json(cities);
  } catch (error: any) {
    console.error("[NovaPoshta API] /cities: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta API] /cities: Error response:", error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ POST /api/nova-poshta/warehouses
 * Отримання відділень або почтоматів за CityRef
 */
router.post('/warehouses', async (req: Request, res: Response) => {
  try {
    const { cityRef, type = "warehouse" } = req.body;

    console.log("[NovaPoshta API] /warehouses: START, cityRef:", cityRef, "type:", type);

    if (!cityRef) {
      console.log("[NovaPoshta API] /warehouses: missing cityRef");
      return res.status(400).json({ error: "cityRef is required" });
    }

    // ✅ ВИЗНАЧАЄМО МЕТОД ЗАЛЕЖНО ВІД ТИПУ
    const calledMethod = type === "postomat" ? "getPosts" : "getWarehouses";

    const response = await axios.post(API_URL, {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: calledMethod,
      methodProperties: {
        CityRef: cityRef,  // ✅ Використовуємо DeliveryCity з searchSettlements
        Limit: 100,
      },
    });

    const data = response.data;
    console.log("[NovaPoshta API] /warehouses: RAW response:", JSON.stringify(data, null, 2));

    // Перевірка помилок API
    if (data.errors && data.errors.length > 0) {
      console.error("[NovaPoshta API] /warehouses: API errors:", data.errors);
      
      // Якщо "City not found" - можливо передано неправильний Ref
      if (data.errors.some((e: string) => e.includes("City not found") || e.includes("Місто не знайдено"))) {
        console.error("[NovaPoshta API] /warehouses: City not found. Check if cityRef is correct DeliveryCity value");
      }
      
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      console.error("[NovaPoshta API] /warehouses: API returned success: false");
      return res.status(500).json({ error: "API returned success: false" });
    }

    const items = data.data || [];
    console.log("[NovaPoshta API] /warehouses: Found", items.length, "items");

    if (items.length === 0) {
      console.log("[NovaPoshta API] /warehouses: No items found for this city");
      return res.json([]);
    }

    // Перетворюємо у зручний формат
    const result = items.map((item: any) => ({
      id: item.Ref,
      label: item.Description,
      number: item.Number,
      shortAddress: item.ShortAddress || item.Address,
      type: type === "postomat" ? "Почтомат" : (item.TypeOfWarehouse || "Відділення"),
      latitude: item.Latitude,
      longitude: item.Longitude,
      schedule: type === "postomat" ? "24/7" : (item.Schedule || "Пн-Пт: 9:00-20:00"),
    }));

    console.log("[NovaPoshta API] /warehouses: END, found", result.length, "items");
    console.log("[NovaPoshta API] /warehouses: First item:", result[0]);

    res.json(result);
  } catch (error: any) {
    console.error("[NovaPoshta API] /warehouses: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta API] /warehouses: Error response:", error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
