import axios, { AxiosError } from 'axios';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;
const REVALIDATE_TIMEOUT = 10000; // Зменшено до 10 секунд
const MAX_RETRIES = 1; // Тільки 1 спроба замість 3

async function revalidateWithRetry(path: string, maxRetries = MAX_RETRIES): Promise<void> {
  if (!REVALIDATION_SECRET) {
    console.warn('⚠️ REVALIDATION_SECRET not set, skipping cache revalidation');
    return;
  }

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Revalidate] Attempt ${attempt}/${maxRetries} for ${path}`);

      await axios.post(`${FRONTEND_URL}/revalidate`, {
        path,
        secret: REVALIDATION_SECRET,
      }, {
        timeout: REVALIDATE_TIMEOUT,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [Revalidate] Success for ${path} (${duration}ms)`);
      return;
    } catch (error) {
      lastError = error as Error;
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          console.warn(`⚠️ [Revalidate] Timeout for ${path} (${duration}ms) - continuing anyway`);
        } else {
          console.warn(`⚠️ [Revalidate] Error for ${path}: ${axiosError.message} - continuing anyway`);
        }
      } else {
        console.warn(`⚠️ [Revalidate] Unknown error for ${path} - continuing anyway`);
      }

      // Не робимо retry - одразу виходимо
      break;
    }
  }

  // Не кидаємо помилку - просто логуємо
  if (lastError) {
    console.warn(`⚠️ [Revalidate] Failed for ${path}, but operation continues`);
  }
}

// ✅ НЕБЛОКУЮЧА версія - запускає revalidate у фоні
export function revalidateProductAsync(slug: string): void {
  // Запускаємо у фоні без await
  revalidateWithRetry(`/catalog/${slug}`)
    .catch(error => {
      console.warn(`[Revalidate] Background revalidation failed for ${slug}:`, error.message);
    });
}

// ✅ НЕБЛОКУЮЧА версія - запускає revalidate у фоні
export function revalidateCatalogAsync(): void {
  // Запускаємо у фоні без await
  revalidateWithRetry('/catalog')
    .catch(error => {
      console.warn(`[Revalidate] Background catalog revalidation failed:`, error.message);
    });
}

// Залишаємо старі функції для зворотної сумісності, але робимо їх неблокуючими
export async function revalidateProduct(slug: string): Promise<void> {
  // Просто викликаємо async версію і одразу повертаємось
  revalidateProductAsync(slug);
}

export async function revalidateCatalog(): Promise<void> {
  // Просто викликаємо async версію і одразу повертаємось
  revalidateCatalogAsync();
}
