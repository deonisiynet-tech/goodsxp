import axios, { AxiosError } from 'axios';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;
const REVALIDATE_TIMEOUT = 5000; // 5 секунд максимум
const MAX_RETRIES = 1; // Тільки 1 спроба

// ✅ SAFE WRAPPER - запускає revalidate у фоні через setTimeout
function safeRevalidate(path: string): void {
  if (!REVALIDATION_SECRET) {
    console.warn('⚠️ REVALIDATION_SECRET not set, skipping revalidation');
    return;
  }

  // Запускаємо у наступному tick event loop - повністю неблокуюче
  setTimeout(async () => {
    try {
      console.log(`[Revalidate] Starting background revalidation for ${path}`);

      const response = await axios.post(`${FRONTEND_URL}/revalidate`, {
        path,
        secret: REVALIDATION_SECRET,
      }, {
        timeout: REVALIDATE_TIMEOUT,
      });

      console.log(`✅ [Revalidate] Success for ${path}`);
    } catch (error) {
      // Просто логуємо - не кидаємо помилку
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          console.warn(`⚠️ [Revalidate] Timeout for ${path} - continuing anyway`);
        } else {
          console.warn(`⚠️ [Revalidate] Error for ${path}: ${axiosError.message}`);
        }
      } else {
        console.warn(`⚠️ [Revalidate] Unknown error for ${path}`);
      }
    }
  }, 0);
}

// ✅ Revalidate для конкретного товару - НЕБЛОКУЮЧЕ
export function revalidateProduct(slug: string): void {
  safeRevalidate(`/catalog/${slug}`);
}

// ✅ Revalidate для каталогу - НЕБЛОКУЮЧЕ
export function revalidateCatalog(): void {
  safeRevalidate('/catalog');
}

// Експортуємо async версії для зворотної сумісності (але вони теж неблокуючі)
export async function revalidateProductAsync(slug: string): Promise<void> {
  revalidateProduct(slug);
}

export async function revalidateCatalogAsync(): Promise<void> {
  revalidateCatalog();
}
