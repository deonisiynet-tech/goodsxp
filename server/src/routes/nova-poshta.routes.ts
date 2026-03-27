import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY || "fd61dad0d97e5d3479d7f3164b54b03f";

console.log("[NovaPoshta] API Key:", API_KEY ? "SET" : "NOT SET");
console.log("[NovaPoshta] API URL:", API_URL);

/**
 * ✅ POST /api/nova-poshta/cities
 * 
 * ПОШУК МІСТ - ПРАВИЛЬНА СТРУКТУРА
 * 
 * Використовуємо:
 * - modelName: Address
 * - calledMethod: searchSettlements
 * - methodProperties: { CityName, Limit }
 */
router.post('/cities', async (req: Request, res: Response) => {
  try {
    const { city } = req.body;

    console.log("=".repeat(60));
    console.log("[NovaPoshta] /cities: START");
    console.log("[NovaPoshta] /cities: Query:", city);

    if (!city || city.trim().length < 2) {
      console.log("[NovaPoshta] /cities: Query too short (< 2 chars)");
      return res.json([]);
    }

    // ✅ ПРАВИЛЬНИЙ ЗАПИТ З CityName (не SettlementName!)
    const requestBody = {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "searchSettlements",
      methodProperties: {
        CityName: city.trim(),  // ✅ ВИКОРИСТОВУЄМО CityName
        Limit: 20,
      },
    };

    console.log("[NovaPoshta] /cities: Request:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    console.log("[NovaPoshta] /cities: RAW Response:", JSON.stringify(data, null, 2));

    // ✅ ПЕРЕВІРКА ПОМИЛОК
    if (data.errors && data.errors.length > 0) {
      console.error("[NovaPoshta] /cities: API Errors:", data.errors);
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      console.error("[NovaPoshta] /cities: API returned success: false");
      return res.status(500).json({ error: "API returned success: false" });
    }

    // ✅ ПРАВИЛЬНИЙ ПАРСИНГ ВІДПОВІДІ
    // Структура: response.data.data[0].Addresses
    const addresses = data.data?.[0]?.Addresses || [];
    console.log("[NovaPoshta] /cities: Found", addresses.length, "addresses");

    if (addresses.length === 0) {
      console.log("[NovaPoshta] /cities: No addresses found");
      return res.json([]);
    }

    // ✅ ПЕРЕТВОРЕННЯ У ЗРУЧНИЙ ФОРМАТ
    const cities = addresses.map((c: any) => ({
      label: c.Present,              // ✅ Коротка назва для відображення
      ref: c.DeliveryCity,           // ✅ DeliveryCity - це правильний Ref для getWarehouses
      description: c.Description,
      region: c.RegionDescription,
      area: c.AreaDescription,
    }));

    console.log("[NovaPoshta] /cities: END - Found", cities.length, "cities");
    console.log("[NovaPoshta] /cities: First city:", cities[0]);
    console.log("=".repeat(60));

    res.json(cities);
  } catch (error: any) {
    console.error("[NovaPoshta] /cities: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta] /cities: Error response:", error.response.data);
    }
    console.log("=".repeat(60));
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ POST /api/nova-poshta/warehouses
 * 
 * ОТРИМАННЯ ВІДДІЛЕНЬ - ПРАВИЛЬНА СТРУКТУРА
 * 
 * Використовуємо:
 * - modelName: Address
 * - calledMethod: getWarehouses
 * - methodProperties: { CityRef }
 * 
 * CityRef = DeliveryCity з попереднього запиту searchSettlements
 */
router.post('/warehouses', async (req: Request, res: Response) => {
  try {
    const { cityRef, type } = req.body;

    console.log("=".repeat(60));
    console.log("[NovaPoshta] /warehouses: START");
    console.log("[NovaPoshta] /warehouses: cityRef:", cityRef);
    console.log("[NovaPoshta] /warehouses: type:", type || "warehouse");

    if (!cityRef) {
      console.error("[NovaPoshta] /warehouses: Missing cityRef");
      return res.status(400).json({ error: "cityRef is required" });
    }

    // ✅ ПЕРЕВІРКА: cityRef не повинен бути довгим описом
    if (cityRef.includes(",") || cityRef.length > 50) {
      console.warn("[NovaPoshta] /warehouses: cityRef looks like description, not Ref!");
      console.warn("[NovaPoshta] /warehouses: cityRef:", cityRef.substring(0, 60) + "...");
    }

    // ✅ ПРАВИЛЬНИЙ ЗАПИТ З CityRef
    const requestBody = {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: cityRef,  // ✅ ВИКОРИСТОВУЄМО DeliveryCity з searchSettlements
        Limit: 100,
      },
    };

    console.log("[NovaPoshta] /warehouses: Request:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    console.log("[NovaPoshta] /warehouses: RAW Response:", JSON.stringify(data, null, 2));

    // ✅ ПЕРЕВІРКА ПОМИЛОК
    if (data.errors && data.errors.length > 0) {
      console.error("[NovaPoshta] /warehouses: API Errors:", data.errors);
      
      // Якщо "City not found" - можливо передано неправильний Ref
      if (data.errors.some((e: string) => e.includes("City not found") || e.includes("Місто не знайдено"))) {
        console.error("[NovaPoshta] /warehouses: City not found. Check if cityRef is correct DeliveryCity value");
      }
      
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      console.error("[NovaPoshta] /warehouses: API returned success: false");
      return res.status(500).json({ error: "API returned success: false" });
    }

    const warehouses = data.data || [];
    console.log("[NovaPoshta] /warehouses: Found", warehouses.length, "warehouses");

    if (warehouses.length === 0) {
      console.log("[NovaPoshta] /warehouses: No warehouses found for this city");
      return res.json([]);
    }

    // ✅ ПЕРЕТВОРЕННЯ У ЗРУЧНИЙ ФОРМАТ
    const result = warehouses.map((w: any) => ({
      id: w.Ref,
      label: w.Description,
      number: w.Number,
      shortAddress: w.ShortAddress,
      type: w.TypeOfWarehouse || "Відділення",
      latitude: w.Latitude,
      longitude: w.Longitude,
      schedule: w.Schedule || "Пн-Пт: 9:00-20:00",
    }));

    console.log("[NovaPoshta] /warehouses: END - Found", result.length, "warehouses");
    console.log("[NovaPoshta] /warehouses: First warehouse:", result[0]);
    console.log("=".repeat(60));

    res.json(result);
  } catch (error: any) {
    console.error("[NovaPoshta] /warehouses: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta] /warehouses: Error response:", error.response.data);
    }
    console.log("=".repeat(60));
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ POST /api/nova-poshta/postomats
 * 
 * ОТРИМАННЯ ПОШТОМАТІВ
 * 
 * Використовуємо той самий метод getWarehouses,
 * але фільтруємо за TypeOfWarehouseRef
 */
router.post('/postomats', async (req: Request, res: Response) => {
  try {
    const { cityRef } = req.body;

    console.log("=".repeat(60));
    console.log("[NovaPoshta] /postomats: START");
    console.log("[NovaPoshta] /postomats: cityRef:", cityRef);

    if (!cityRef) {
      console.error("[NovaPoshta] /postomats: Missing cityRef");
      return res.status(400).json({ error: "cityRef is required" });
    }

    // ✅ ЗАПИТ З ФІЛЬТРОМ ПОШТОМАТІВ
    const requestBody = {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: cityRef,
        Limit: 100,
      },
    };

    console.log("[NovaPoshta] /postomats: Request:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data;
    console.log("[NovaPoshta] /postomats: RAW Response:", JSON.stringify(data, null, 2));

    // ✅ ПЕРЕВІРКА ПОМИЛОК
    if (data.errors && data.errors.length > 0) {
      console.error("[NovaPoshta] /postomats: API Errors:", data.errors);
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      console.error("[NovaPoshta] /postomats: API returned success: false");
      return res.status(500).json({ error: "API returned success: false" });
    }

    const allWarehouses = data.data || [];
    console.log("[NovaPoshta] /postomats: Total warehouses:", allWarehouses.length);

    // ✅ ФІЛЬТРУЄМО ТІЛЬКИ ПОШТОМАТИ
    // TypeOfWarehouseRef для поштоматів зазвичай має специфічне значення
    const postomats = allWarehouses.filter((w: any) => 
      w.TypeOfWarehouse && w.TypeOfWarehouse.toLowerCase().includes("поштомат")
    );

    console.log("[NovaPoshta] /postomats: Filtered postomats:", postomats.length);

    if (postomats.length === 0) {
      console.log("[NovaPoshta] /postomats: No postomats found for this city");
      return res.json([]);
    }

    // ✅ ПЕРЕТВОРЕННЯ У ЗРУЧНИЙ ФОРМАТ
    const result = postomats.map((p: any) => ({
      id: p.Ref,
      label: p.Description,
      number: p.Number,
      shortAddress: p.ShortAddress,
      type: "Почтомат",
      latitude: p.Latitude,
      longitude: p.Longitude,
      schedule: "24/7",
    }));

    console.log("[NovaPoshta] /postomats: END - Found", result.length, "postomats");
    console.log("[NovaPoshta] /postomats: First postomat:", result[0]);
    console.log("=".repeat(60));

    res.json(result);
  } catch (error: any) {
    console.error("[NovaPoshta] /postomats: ERROR:", error.message);
    if (error.response) {
      console.error("[NovaPoshta] /postomats: Error response:", error.response.data);
    }
    console.log("=".repeat(60));
    res.status(500).json({ error: error.message });
  }
});

export default router;
