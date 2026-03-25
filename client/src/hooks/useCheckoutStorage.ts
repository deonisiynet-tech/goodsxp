'use client';

import { useEffect, useState } from 'react';

interface CheckoutData {
  surname?: string;
  firstName?: string;
  middleName?: string;
  name?: string;
  phone: string;
  email: string;
  city?: string | null;
  warehouse?: string | null;
  warehouseAddress?: string | null;
}

const STORAGE_KEY = 'checkout_data';

export function useCheckoutStorage() {
  const [savedData, setSavedData] = useState<CheckoutData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Завантаження даних при монтажі
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSavedData(parsed);
        }
      } catch (error) {
        console.error('Error loading checkout data from localStorage:', error);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []);

  // Збереження даних при зміні
  const saveData = (data: CheckoutData) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSavedData(data);
      } catch (error) {
        console.error('Error saving checkout data to localStorage:', error);
      }
    }
  };

  // Очищення даних
  const clearData = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        setSavedData(null);
      } catch (error) {
        console.error('Error clearing checkout data from localStorage:', error);
      }
    }
  };

  return {
    savedData,
    isLoaded,
    saveData,
    clearData,
  };
}
