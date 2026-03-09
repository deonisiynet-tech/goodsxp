'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface Settings {
  storeName: string
  contactEmail: string
  currency: string
  storeEnabled: boolean
}

export async function getSettings(): Promise<Settings> {
  try {
    const settings = await prisma.siteSettings.findMany()

    const settingsObj: Record<string, string> = {}
    settings.forEach((s) => {
      settingsObj[s.key] = s.value
    })

    return {
      storeName: settingsObj['storeName'] || 'GoodsXP',
      contactEmail: settingsObj['contactEmail'] || '',
      currency: settingsObj['currency'] || 'UAH',
      storeEnabled: settingsObj['storeEnabled'] !== 'false',
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Return default settings on error
    return {
      storeName: 'GoodsXP',
      contactEmail: '',
      currency: 'UAH',
      storeEnabled: true,
    }
  }
}

export async function updateSettings(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const storeName = formData.get('storeName') as string
    const contactEmail = formData.get('contactEmail') as string
    const currency = formData.get('currency') as string
    const storeEnabled = formData.get('storeEnabled') === 'true'

    const updates = [
      prisma.siteSettings.upsert({
        where: { key: 'storeName' },
        update: { value: storeName },
        create: { key: 'storeName', value: storeName, description: 'Назва магазину' },
      }),
      prisma.siteSettings.upsert({
        where: { key: 'contactEmail' },
        update: { value: contactEmail },
        create: { key: 'contactEmail', value: contactEmail, description: 'Контактний email' },
      }),
      prisma.siteSettings.upsert({
        where: { key: 'currency' },
        update: { value: currency },
        create: { key: 'currency', value: currency, description: 'Валюта магазину' },
      }),
      prisma.siteSettings.upsert({
        where: { key: 'storeEnabled' },
        update: { value: storeEnabled ? 'true' : 'false' },
        create: {
          key: 'storeEnabled',
          value: storeEnabled ? 'true' : 'false',
          description: 'Магазин включений',
        },
      }),
    ]

    await Promise.all(updates)

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { success: false, error: 'Помилка при збереженні налаштувань' }
  }
}
