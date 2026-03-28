'use client';

import { useState, useEffect, useRef, useCallback } from "react";

interface City {
  label: string;
  ref: string;
  description?: string;
  region?: string;
  area?: string;
}

interface Warehouse {
  id: string;
  label: string;
  number: string;
  shortAddress: string;
  type: string;
  latitude?: string;
  longitude?: string;
  schedule?: string;
}

type DeliveryType = "warehouse" | "courier";

interface NovaPoshtaSelectorProps {
  onCityChange: (city: City | null) => void;
  onWarehouseChange: (warehouse: Warehouse | null) => void;
  onDeliveryTypeChange?: (type: DeliveryType | null) => void;
  selectedCity?: City | null;
  selectedWarehouse?: Warehouse | null;
  savedCityName?: string | null;
}

/**
 * ✅ DEBOUNCE ХУК - 500ms
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * ✅ Визначення типу пункту видачі з API даних
 * Сервер вже повертає правильний тип, тому просто перевіряємо значення
 */
function getWarehouseType(warehouseType: string): { isPostomat: boolean; icon: string; label: string } {
  const isPostomat = warehouseType === "Поштомат";
  
  return {
    isPostomat,
    icon: isPostomat ? "📦" : "🏢",
    label: isPostomat ? "Поштомат" : "Відділення",
  };
}

export default function NovaPoshtaSelector({
  onCityChange,
  onWarehouseChange,
  onDeliveryTypeChange,
  selectedCity,
  selectedWarehouse,
  savedCityName,
}: NovaPoshtaSelectorProps) {
  // ✅ СТАН ДЛЯ МІСТА
  const [cityInput, setCityInput] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // ✅ СТАН ДЛЯ ВІДДІЛЕНЬ
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("warehouse");

  // ✅ DEBOUNCED значення для пошуку (500ms затримка)
  const debouncedCitySearch = useDebounce(cityInput, 500);

  // ✅ Рефи для dropdown
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Відновлення збереженого міста
  useEffect(() => {
    if (savedCityName && !selectedCity) {
      setCityInput(savedCityName);
    }
  }, [savedCityName, selectedCity]);

  // ✅ Пошук міст при зміні debounced значення
  useEffect(() => {
    const search = async () => {
      if (debouncedCitySearch.trim().length >= 2) {
        await searchCities(debouncedCitySearch);
      } else {
        setCities([]);
        setShowCityDropdown(false);
      }
    };
    search();
  }, [debouncedCitySearch]);

  // ✅ Закриття dropdown при кліку поза ними
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(event.target as Node)) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Сповіщення про зміну типу доставки
  useEffect(() => {
    if (onDeliveryTypeChange) {
      onDeliveryTypeChange(deliveryType);
    }
  }, [deliveryType, onDeliveryTypeChange]);

  /**
   * ✅ ПОШУК МІСТ - API ЗАПИТ
   */
  const searchCities = useCallback(async (query: string) => {
    setIsLoadingCities(true);
    try {
      const response = await fetch("/api/nova-poshta/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: query }),
      });

      const result = await response.json();

      if (Array.isArray(result) && result.length > 0) {
        setCities(result);
        setShowCityDropdown(true);
      } else {
        setCities([]);
        setShowCityDropdown(false);
      }
    } catch (error) {
      setCities([]);
      setShowCityDropdown(false);
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  /**
   * ✅ ВИБІР МІСТА
   */
  const handleCitySelect = (city: City) => {
    onCityChange(city);
    setCityInput(city.label);
    setShowCityDropdown(false);
    setWarehouses([]);
    onWarehouseChange(null);
    loadWarehouses(city.ref);
  };

  /**
   * ✅ ЗАВАНТАЖЕННЯ ВІДДІЛЕНЬ ТА ПОШТОМАТІВ
   */
  const loadWarehouses = async (cityRef: string) => {
    setIsLoadingWarehouses(true);
    try {
      const response = await fetch("/api/nova-poshta/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityRef }),
      });

      const result = await response.json();

      if (Array.isArray(result) && result.length > 0) {
        setWarehouses(result);
      } else {
        setWarehouses([]);
      }
    } catch (error) {
      setWarehouses([]);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  /**
   * ✅ ЗМІНА ТИПУ ДОСТАВКИ
   */
  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
    if (selectedCity) {
      loadWarehouses(selectedCity.ref);
    }
    onWarehouseChange(null);
  };

  /**
   * ✅ ВИБІР ВІДДІЛЕННЯ
   */
  const handleWarehouseSelect = (warehouse: Warehouse) => {
    onWarehouseChange(warehouse);
    setShowWarehouseDropdown(false);
  };

  /**
   * ✅ ОБРОБКА ВВЕДЕННЯ МІСТА
   */
  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCityInput(value);
    
    if (!value) {
      onCityChange(null);
      onWarehouseChange(null);
      setWarehouses([]);
      setShowCityDropdown(false);
    } else {
      setShowCityDropdown(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <h3 className="text-lg font-medium">Доставка Новою Поштою</h3>
      </div>

      {/* Тип доставки - 2 кнопки */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleDeliveryTypeChange("warehouse")}
          className={`p-3 rounded-xl border transition-all duration-200 ${
            deliveryType === "warehouse"
              ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
              : "bg-[#1f1f23] border-purple-500/20 text-muted hover:border-purple-500/40"
          }`}
        >
          <div className="text-sm font-medium">🏣 Відділення / Поштомат</div>
        </button>
        <button
          type="button"
          onClick={() => handleDeliveryTypeChange("courier")}
          className={`p-3 rounded-xl border transition-all duration-200 ${
            deliveryType === "courier"
              ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
              : "bg-[#1f1f23] border-purple-500/20 text-muted hover:border-purple-500/40"
          }`}
        >
          <div className="text-sm font-medium">🚚 Кур'єр</div>
        </button>
      </div>

      {/* Місто */}
      <div className="relative" ref={cityDropdownRef}>
        <label className="block text-sm font-medium mb-1">
          Місто <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={cityInput}
            onChange={handleCityInputChange}
            onFocus={() => cityInput.trim().length >= 2 && setShowCityDropdown(true)}
            className="input-field pr-10"
            placeholder="Почніть вводити назву міста..."
            autoComplete="off"
          />
          {isLoadingCities && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoadingCities && cityInput.length >= 2 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>

        {showCityDropdown && cities.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-64 overflow-y-auto">
            {cities.map((city) => (
              <button
                key={city.ref}
                type="button"
                onClick={() => handleCitySelect(city)}
                className="w-full px-4 py-3 text-left hover:bg-purple-500/10 transition-colors duration-150 border-b border-purple-500/10 last:border-b-0"
              >
                <div className="font-medium text-white">{city.label}</div>
                {(city.region || city.area) && (
                  <div className="text-sm text-muted mt-0.5">
                    {city.region}
                    {city.area && <span className="ml-1">({city.area})</span>}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {showCityDropdown && cityInput.trim().length >= 2 && cities.length === 0 && !isLoadingCities && (
          <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-4 text-center text-muted">
            Міста не знайдено
          </div>
        )}
      </div>

      {/* Відділення / Поштомат / Кур'єр */}
      {selectedCity && deliveryType !== "courier" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">
              Відділення / Поштомат <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Список відділень/почтоматів - ЗОВНІ контейнера */}
          <div>
            <div className="relative" ref={warehouseDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={selectedWarehouse ? `№${selectedWarehouse.number} - ${selectedWarehouse.shortAddress}` : ""}
                  readOnly
                  placeholder="Оберіть відділення або поштомат..."
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

              {/* ✅ Dropdown з високим z-index і overflow-y-auto */}
              {showWarehouseDropdown && warehouses.length > 0 && (
                <div className="absolute z-[9999] w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-[400px] overflow-y-auto overflow-x-hidden pb-[20px]">
                  {warehouses.map((warehouse) => {
                    const { icon, label: typeLabel } = getWarehouseType(warehouse.type);
                    
                    return (
                      <button
                        key={warehouse.id}
                        type="button"
                        onClick={() => handleWarehouseSelect(warehouse)}
                        className={`w-full px-4 py-3 text-left transition-colors duration-150 border-b border-purple-500/10 last:border-b-0 ${
                          selectedWarehouse?.id === warehouse.id
                            ? "bg-purple-500/20 text-purple-400"
                            : "hover:bg-purple-500/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl shrink-0">{icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm">
                              {typeLabel} №{warehouse.number}
                            </div>
                            <div className="text-sm text-muted mt-0.5 truncate">
                              📍 {warehouse.shortAddress}
                            </div>
                          </div>
                          {selectedWarehouse?.id === warehouse.id && (
                            <svg className="w-5 h-5 text-purple-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {showWarehouseDropdown && warehouses.length === 0 && !isLoadingWarehouses && (
                <div className="absolute z-50 w-full mt-1 bg-[#18181c] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-4 text-center text-muted">
                  Відділення не знайдено
                </div>
              )}
            </div>
          </div>

          {isLoadingWarehouses && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Завантаження...
            </div>
          )}

          {warehouses.length > 0 && !selectedWarehouse && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
              ⚠️ Оберіть відділення або поштомат для продовження
            </div>
          )}

          {selectedWarehouse && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400">
              ✅ Обрано: {getWarehouseType(selectedWarehouse.type).label} №{selectedWarehouse.number}, {selectedWarehouse.shortAddress}
            </div>
          )}
        </div>
      )}

      {/* Кур'єрська доставка */}
      {selectedCity && deliveryType === "courier" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-400">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚚</span>
            <div>
              <div className="font-medium mb-1">Кур'єрська доставка</div>
              <div className="text-muted">
                Кур'єр доставить замовлення за вашою адресою. Менеджер зв'яжеться з вами для уточнення деталей.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
