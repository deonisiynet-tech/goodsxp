import axios from 'axios';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

export async function revalidateProduct(slug: string) {
  if (!REVALIDATION_SECRET) {
    console.warn('REVALIDATION_SECRET not set, skipping cache revalidation');
    return;
  }

  try {
    await axios.post(`${FRONTEND_URL}/_revalidate`, {
      path: `/catalog/${slug}`,
      secret: REVALIDATION_SECRET,
    }, {
      timeout: 5000,
    });
    console.log(`✅ Revalidated cache for product: ${slug}`);
  } catch (error) {
    console.error(`❌ Failed to revalidate cache for ${slug}:`, error);
  }
}

export async function revalidateCatalog() {
  if (!REVALIDATION_SECRET) {
    console.warn('REVALIDATION_SECRET not set, skipping cache revalidation');
    return;
  }

  try {
    await axios.post(`${FRONTEND_URL}/_revalidate`, {
      path: '/catalog',
      secret: REVALIDATION_SECRET,
    }, {
      timeout: 5000,
    });
    console.log(`✅ Revalidated catalog page`);
  } catch (error) {
    console.error(`❌ Failed to revalidate catalog:`, error);
  }
}
