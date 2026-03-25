'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';

interface City {
  Ref: string;
  Description: string;
  RegionDescription: string;
  AreaDescription?: string;
}

interface Warehouse {
  Ref: string;
  Description: string;
  ShortAddress: string;
  Number: string;
  Latitude?: string;
  Longitude?: string;
}

interface NovaPoshtaSelectorProps {
  onCityChange: (city: City | null) => void;
  onWarehouseChange: (warehouse: Warehouse | null) => void;
  selectedCity?: City | null;
  selectedWarehouse?: Warehouse | null;
  savedCityName?: string | null;
  savedWarehouseNumber?: string | null;
}

// Dynamic import для карти з SSR вимкненням
const WarehouseMap = dynamic(
  () => import('./WarehouseMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-[#18181c] border border-purple-500/20 rounded-xl flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
);

export default function NovaPoshtaSelector({
  onCityChange,
  onWarehouseChange,
  selectedCity,
  selectedWarehouse,
  savedCityName,
  savedWarehouseNumber,
}: NovaPoshtaSelectorProps) {
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);

  // Відновлення збереженого міста
  useEffect(() => {
    if (savedCityName && !selectedCity) {
      setCitySearch(savedCityName);
    }
  }, [savedCityName, selectedCity]);

  // Debounce для пошуку міст
  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearch.trim().length >= 2) {
        searchCities(citySearch);
      } else {
        setCities([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [citySearch]);

  // Закриття dropdown при кліку поза ними
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(event.target as Node)) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    setIsLoadingCities(true);
    try {
      const response = await fetch('/api/novaposhta/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: query }),
      });

      const result = await response.json();
      if (result.success) {
        setCities(result.data);
        setShowCityDropdown(true);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleCitySelect = (city: City) => {
    onCityChange(city);
    setCitySearch(city.Description);
    setShowCityDropdown(false);
    setWarehouses([]);
    onWarehouseChange(null);
    loadWarehouses(city.Ref);
  };

  const loadWarehouses = async (cityRef: string) => {
    setIsLoadingWarehouses(true);
    try {
      const response = await fetch('/api/novaposhta/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityRef }),
      });

      const result = await response.json();
      if (result.success) {
        setWarehouses(result.data);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    onWarehouseChange(warehouse);
    setShowWarehouseDropdown(false);
    setShowMap(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <h3 className="text-lg font-medium">Доставка Новою Поштою</h3>
      </div>

      {/* Місто */}
      <div className="relative" ref={cityDropdownRef}>
        <label className="block text-sm font-medium mb-1">
          Місто <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              onCityChange(null);
              onWarehouseChange(null);
              setWarehouses([]);
            }}
            onFocus={() => citySearch.trim().length >= 2 && setShowCityDropdown(true)}
            className="input-field pr-10"
            placeholder="Почніть вводити назву міста..."
            autoComplete="off"
          />
          {isLoadingCities && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showCityDropdown && cities.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-64 overflow-y-auto">
            {cities.map((city) => (
              <button
                key={city.Ref}
                type="button"
                onClick={() => handleCitySelect(city)}
                className="w-full px-4 py-3 text-left hover:bg-purple-500/10 transition-colors duration-150 border-b border-purple-500/10 last:border-b-0"
              >
                <div className="font-medium">{city.Description}</div>
                {(city.RegionDescription || city.AreaDescription) && (
                  <div className="text-sm text-muted mt-0.5">
                    {city.RegionDescription}
                    {city.AreaDescription && <span className="ml-1">({city.AreaDescription})</span>}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {showCityDropdown && citySearch.trim().length >= 2 && cities.length === 0 && !isLoadingCities && (
          <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-4 text-center text-muted">
            Міста не знайдено
          </div>
        )}
      </div>

      {/* Відділення */}
      {selectedCity && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">
              Відділення Нової Пошти <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  !showMap
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-muted hover:text-white'
                }`}
              >
                Список
              </button>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  showMap
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-muted hover:text-white'
                }`}
              >
                Карта
              </button>
            </div>
          </div>

          {!showMap ? (
            /* Список відділень */
            <div className="relative" ref={warehouseDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={selectedWarehouse ? `№${selectedWarehouse.Number} - ${selectedWarehouse.ShortAddress}` : ''}
                  readOnly
                  placeholder="Оберіть відділення зі списку..."
                  onFocus={() => warehouses.length > 0 && setShowWarehouseDropdown(true)}
                  className="input-field pr-10 cursor-pointer"
                  autoComplete="off"
                />
                {isLoadingWarehouses && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!isLoadingWarehouses && warehouses.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>

              {showWarehouseDropdown && warehouses.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-64 overflow-y-auto">
                  {warehouses.map((warehouse) => (
                    <button
                      key={warehouse.Ref}
                      type="button"
                      onClick={() => handleWarehouseSelect(warehouse)}
                      className={`w-full px-4 py-3 text-left transition-colors duration-150 border-b border-purple-500/10 last:border-b-0 ${
                        selectedWarehouse?.Ref === warehouse.Ref
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'hover:bg-purple-500/10'
                      }`}
                    >
                      <div className="font-medium">
                        Відділення №{warehouse.Number}
                      </div>
                      <div className="text-sm text-muted mt-1">
                        {warehouse.ShortAddress}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showWarehouseDropdown && warehouses.length === 0 && !isLoadingWarehouses && (
                <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-4 text-center text-muted">
                  Відділення не знайдено
                </div>
              )}
            </div>
          ) : (
            /* Карта відділень */
            <div className="mt-2">
              {isLoadingWarehouses ? (
                <div className="h-[400px] bg-[#18181c] border border-purple-500/20 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : warehouses.length > 0 ? (
                <Suspense fallback={
                  <div className="h-[400px] bg-[#18181c] border border-purple-500/20 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }>
                  <WarehouseMap
                    warehouses={warehouses}
                    selectedWarehouse={selectedWarehouse}
                    onWarehouseSelect={handleWarehouseSelect}
                  />
                </Suspense>
              ) : (
                <div className="h-[400px] bg-[#18181c] border border-purple-500/20 rounded-xl flex items-center justify-center">
                  <p className="text-muted">Відділення не знайдено</p>
                </div>
              )}
            </div>
          )}

          {isLoadingWarehouses && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Завантаження відділень...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
