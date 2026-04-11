'use client';

import { normalizeImageUrl } from '@/lib/image-utils';

export interface OptionValue {
  id: string;
  value: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: OptionValue[];
}

export interface VariantOption {
  optionId: string;
  optionValueId: string;
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  price: number;
  stock: number;
  image: string | null;
  options: VariantOption[];
}

interface VariantSelectorProps {
  options: ProductOption[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>; // { optionId: optionValueId }
  onOptionSelect: (optionId: string, valueId: string) => void;
  selectedVariant: ProductVariant | null;
}

export default function VariantSelector({
  options,
  variants,
  selectedOptions,
  onOptionSelect,
  selectedVariant,
}: VariantSelectorProps) {
  if (options.length === 0 && variants.length === 0) return null;

  // Якщо options порожні але variants є — показуємо інфо
  if (options.length === 0) {
    return (
      <div className="text-sm text-[#9ca3af]">
        {variants.length > 0 && (
          <span>Доступно варіантів: {variants.length}</span>
        )}
      </div>
    );
  }

  // Перевіряємо чи доступний варіант для поточної комбінації
  const getAvailableValues = (option: ProductOption): Set<string> => {
    const available = new Set<string>();

    for (const v of variants) {
      // Перевіряємо чи цей варіант сумісний з іншими обраними опціями
      let compatible = true;
      for (const [optId, valId] of Object.entries(selectedOptions)) {
        if (optId === option.id) continue; // пропускаємо поточну опцію
        const vOpt = (v.options as VariantOption[]).find((o) => o.optionId === optId);
        if (vOpt && vOpt.optionValueId !== valId) {
          compatible = false;
          break;
        }
      }
      if (compatible) {
        const vOpt = (v.options as VariantOption[]).find((o) => o.optionId === option.id);
        if (vOpt) available.add(vOpt.optionValueId);
      }
    }

    return available;
  };

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const availableValues = getAvailableValues(option);
        const selected = selectedOptions[option.id];

        return (
          <div key={option.id}>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              {option.name}
              {selected && (
                <span className="ml-2 text-white">
                  — {option.values.find((v) => v.id === selected)?.value}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {option.values.map((val) => {
                const isAvailable = availableValues.has(val.id);
                const isSelected = selected === val.id;

                return (
                  <button
                    key={val.id}
                    onClick={() => isAvailable && onOptionSelect(option.id, val.id)}
                    disabled={!isAvailable}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                      isSelected
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : isAvailable
                        ? 'bg-[#1f1f23] border border-[#26262b] text-white hover:border-purple-500/50'
                        : 'bg-[#1f1f23]/50 text-[#4a4a52] cursor-not-allowed line-through'
                    }`}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Variant stock/price info */}
      {selectedVariant && (
        <div className="flex items-center gap-3 pt-2">
          <span
            className={`text-sm font-medium ${
              selectedVariant.stock > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {selectedVariant.stock > 0
              ? `В наявності: ${selectedVariant.stock} шт.`
              : 'Немає в наявності'}
          </span>
          {selectedVariant.price && (
            <span className="text-sm text-[#9ca3af]">
              Ціна: {Number(selectedVariant.price).toLocaleString('uk-UA')} ₴
            </span>
          )}
        </div>
      )}
    </div>
  );
}
