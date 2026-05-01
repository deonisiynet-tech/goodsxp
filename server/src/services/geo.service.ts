interface GeoLocation {
  country: string | null;
  city: string | null;
  region: string | null;
  org: string | null;  // ISP
}

interface CachedGeo {
  data: GeoLocation;
  expires: number;
}

// In-memory cache: IP → geo (24 години)
const geoCache = new Map<string, CachedGeo>();

export class GeoService {
  /**
   * Отримати геолокацію по IP
   * Використовує ip-api.com (безкоштовний, 45 req/min)
   */
  async getLocation(ip: string): Promise<GeoLocation> {
    // Перевірити кеш
    const cached = geoCache.get(ip);
    if (cached && cached.expires > Date.now()) {
      console.debug(`[Geo] Cache hit for ${ip}`);
      return cached.data;
    }

    // Localhost → пропустити
    if (ip === '127.0.0.1' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: null, city: null, region: null, org: null };
    }

    try {
      console.log(`[Geo] Fetching location for ${ip}...`);

      // ip-api.com безкоштовний API
      const response = await fetch(
        `https://ip-api.com/json/${ip}?fields=country,city,regionName,org,status`,
        { timeout: 5000 } as any
      );

      if (!response.ok) {
        throw new Error(`Geo API error: ${response.status}`);
      }

      const data = await response.json() as any;

      if (data.status === 'fail') {
        console.warn(`[Geo] Invalid IP: ${ip}`);
        return { country: null, city: null, region: null, org: null };
      }

      const location: GeoLocation = {
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null,
        org: data.org || null,
      };

      // Кешувати на 24 години
      geoCache.set(ip, {
        data: location,
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });

      console.log(`[Geo] ✅ ${ip} → ${this.formatLocation(location)}`);
      return location;
    } catch (error: any) {
      console.warn(`[Geo] Lookup failed for ${ip}:`, error.message);
      // Fallback — не ламати систему
      return { country: null, city: null, region: null, org: null };
    }
  }

  /**
   * Форматувати локацію для UI
   */
  formatLocation(geo: GeoLocation): string | null {
    if (!geo.city && !geo.country) return null;

    const parts: string[] = [];
    if (geo.city) parts.push(geo.city);
    if (geo.country) parts.push(geo.country);

    return parts.join(', ');
  }

  /**
   * Очистити кеш (для тестування)
   */
  clearCache(): void {
    geoCache.clear();
    console.log('[Geo] Cache cleared');
  }

  /**
   * Отримати розмір кешу
   */
  getCacheSize(): number {
    return geoCache.size;
  }
}

export const geoService = new GeoService();
