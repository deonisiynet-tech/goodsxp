import axios, { AxiosError } from 'axios';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;
const REVALIDATE_TIMEOUT = 20000;
const MAX_RETRIES = 3;

async function revalidateWithRetry(path: string, maxRetries = MAX_RETRIES): Promise<void> {
  if (!REVALIDATION_SECRET) {
    console.warn('REVALIDATION_SECRET not set, skipping cache revalidation');
    return;
  }

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Revalidate] Starting attempt ${attempt}/${maxRetries} for path: ${path}`);

      await axios.post(`${FRONTEND_URL}/revalidate`, {
        path,
        secret: REVALIDATION_SECRET,
      }, {
        timeout: REVALIDATE_TIMEOUT,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [Revalidate] Success for ${path} (${duration}ms, attempt ${attempt}/${maxRetries})`);
      return;
    } catch (error) {
      lastError = error as Error;
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          console.warn(`⚠️ [Revalidate] Timeout on attempt ${attempt}/${maxRetries} for ${path} (${duration}ms)`);
        } else {
          console.warn(`⚠️ [Revalidate] Error on attempt ${attempt}/${maxRetries} for ${path}: ${axiosError.message}`);
        }
      } else {
        console.warn(`⚠️ [Revalidate] Unknown error on attempt ${attempt}/${maxRetries} for ${path}:`, error);
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * attempt, 3000);
        console.log(`[Revalidate] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ [Revalidate] Failed after ${maxRetries} attempts for ${path}:`, lastError?.message || 'Unknown error');
}

export async function revalidateProduct(slug: string) {
  try {
    await revalidateWithRetry(`/catalog/${slug}`);
  } catch (error) {
    console.error(`[Revalidate] Product revalidation failed for ${slug}, but continuing...`);
  }
}

export async function revalidateCatalog() {
  try {
    await revalidateWithRetry('/catalog');
  } catch (error) {
    console.error(`[Revalidate] Catalog revalidation failed, but continuing...`);
  }
}
