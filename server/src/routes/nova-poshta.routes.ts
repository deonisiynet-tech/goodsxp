import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY || "fd61dad0d97e5d3479d7f3164b54b03f";

/**
 * ✅ POST /api/nova-poshta/cities
 * Пошук міст
 */
router.post('/cities', async (req: Request, res: Response) => {
  try {
    const { city } = req.body;

    if (!city || city.trim().length < 2) {
      return res.json([]);
    }

    const requestBody = {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "searchSettlements",
      methodProperties: {
        CityName: city.trim(),
        Limit: 20,
      },
    };

    const response = await axios.post(API_URL, requestBody, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    if (data.errors && data.errors.length > 0) {
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      return res.status(500).json({ error: "API returned success: false" });
    }

    const addresses = data.data?.[0]?.Addresses || [];

    if (addresses.length === 0) {
      return res.json([]);
    }

    const cities = addresses.map((c: any) => ({
      label: c.Present,
      ref: c.DeliveryCity,
      description: c.Description,
      region: c.RegionDescription,
      area: c.AreaDescription,
    }));

    res.json(cities);
  } catch (error: any) {
    if (error.response) {
      console.error("[NovaPoshta] /cities Error:", error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ POST /api/nova-poshta/warehouses
 * Отримання відділень
 */
router.post('/warehouses', async (req: Request, res: Response) => {
  try {
    const { cityRef } = req.body;

    if (!cityRef) {
      return res.status(400).json({ error: "cityRef is required" });
    }

    const requestBody = {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: cityRef,
        Limit: 100,
      },
    };

    const response = await axios.post(API_URL, requestBody, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    if (data.errors && data.errors.length > 0) {
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      return res.status(500).json({ error: "API returned success: false" });
    }

    const warehouses = data.data || [];

    if (warehouses.length === 0) {
      return res.json([]);
    }

    const result = warehouses.map((w: any) => ({
      id: w.Ref,
      label: w.Description,
      number: w.Number,
      shortAddress: w.ShortAddress,
      type: w.TypeOfWarehouse || "Відділення",
      latitude: w.Latitude,
      longitude: w.Longitude,
      schedule: typeof w.Schedule === 'string' ? w.Schedule : "Пн-Пт: 9:00-20:00",
    }));

    res.json(result);
  } catch (error: any) {
    if (error.response) {
      console.error("[NovaPoshta] /warehouses Error:", error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ POST /api/nova-poshta/postomats
 * Отримання почтоматів (фільтрація з getWarehouses)
 */
router.post('/postomats', async (req: Request, res: Response) => {
  try {
    const { cityRef } = req.body;

    if (!cityRef) {
      return res.status(400).json({ error: "cityRef is required" });
    }

    const requestBody = {
      apiKey: API_KEY,
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: {
        CityRef: cityRef,
        Limit: 100,
      },
    };

    const response = await axios.post(API_URL, requestBody, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    if (data.errors && data.errors.length > 0) {
      return res.status(400).json({ error: data.errors });
    }

    if (!data.success) {
      return res.status(500).json({ error: "API returned success: false" });
    }

    const allWarehouses = data.data || [];

    // Фільтруємо тільки почтомати
    const postomats = allWarehouses.filter((w: any) => 
      w.TypeOfWarehouse && w.TypeOfWarehouse.toLowerCase().includes("поштомат")
    );

    if (postomats.length === 0) {
      return res.json([]);
    }

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

    res.json(result);
  } catch (error: any) {
    if (error.response) {
      console.error("[NovaPoshta] /postomats Error:", error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
