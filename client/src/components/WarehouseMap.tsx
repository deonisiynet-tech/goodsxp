'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Warehouse {
  Ref: string;
  Description: string;
  ShortAddress: string;
  Number: string;
  Latitude?: string;
  Longitude?: string;
  Schedule?: string;
  Type?: string;
}

interface WarehouseMapProps {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  onWarehouseSelect: (warehouse: Warehouse) => void;
  deliveryType?: 'warehouse' | 'postomat' | 'courier';
}

// Fix for default marker icon in Next.js
const createCustomIcon = (isSelected: boolean, type?: string) => {
  const color = type === 'postomat' ? '#10b981' : isSelected ? 'linear-gradient(135deg, #a855f7, #ec4899)' : '#6b7280';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${isSelected ? '40' : '32'}px;
        height: ${isSelected ? '40' : '32'}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      ">
        <div style="
          width: ${isSelected ? '16' : '12'}px;
          height: ${isSelected ? '16' : '12'}px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
    popupAnchor: [0, -20],
  });
};

// Component to handle map center changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1 });
  }, [center, map]);
  return null;
}

export default function WarehouseMap({ warehouses, selectedWarehouse, onWarehouseSelect }: WarehouseMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.4501, 30.5234]); // Київ за замовчуванням

  useEffect(() => {
    if (warehouses.length > 0) {
      const firstWarehouse = warehouses[0];
      if (firstWarehouse.Latitude && firstWarehouse.Longitude) {
        setMapCenter([parseFloat(firstWarehouse.Latitude), parseFloat(firstWarehouse.Longitude)]);
      }
    }
  }, [warehouses]);

  const handleMarkerClick = (warehouse: Warehouse) => {
    onWarehouseSelect(warehouse);
    if (warehouse.Latitude && warehouse.Longitude) {
      setMapCenter([parseFloat(warehouse.Latitude), parseFloat(warehouse.Longitude)]);
    }
  };

  // Фільтруємо відділення з координатами
  const warehousesWithCoords = warehouses.filter(
    (w) => w.Latitude && w.Longitude && !isNaN(parseFloat(w.Latitude)) && !isNaN(parseFloat(w.Longitude))
  );

  console.log('[WarehouseMap] Total warehouses:', warehouses.length);
  console.log('[WarehouseMap] Warehouses with coords:', warehousesWithCoords.length);

  if (warehousesWithCoords.length === 0) {
    console.log('[WarehouseMap] No warehouses with coordinates, showing message');
    return (
      <div className="h-[400px] bg-[#18181c] border border-purple-500/20 rounded-xl flex items-center justify-center">
        <p className="text-muted">Карта тимчасово недоступна</p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden border border-purple-500/20">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#18181c' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={mapCenter} />
        {warehousesWithCoords.map((warehouse) => (
          <Marker
            key={warehouse.Ref}
            position={[parseFloat(warehouse.Latitude!), parseFloat(warehouse.Longitude!)]}
            icon={createCustomIcon(selectedWarehouse?.Ref === warehouse.Ref, warehouse.Type)}
            eventHandlers={{
              click: () => handleMarkerClick(warehouse),
            }}
          >
            <Popup
              closeButton={false}
              autoClose={false}
              closeOnClick={false}
            >
              <div className="text-gray-800 max-w-[250px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{warehouse.Type === 'Почтомат' ? '📦' : '🏢'}</span>
                  <span className="font-semibold text-base">
                    {warehouse.Type === 'Почтомат' ? 'Почтомат' : 'Відділення'} №{warehouse.Number}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">{warehouse.ShortAddress}</div>
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <span>🕐</span>
                  <span>{warehouse.Schedule || 'Пн-Пт: 9:00-20:00, Сб: 9:00-18:00'}</span>
                </div>
                <button
                  onClick={() => handleMarkerClick(warehouse)}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  {selectedWarehouse?.Ref === warehouse.Ref ? '✓ Обрано' : 'Обрати'}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Інформаційна панель */}
      <div className="absolute bottom-4 left-4 right-4 bg-[#18181c]/95 backdrop-blur-sm border border-purple-500/30 rounded-xl p-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700"></div>
            <span className="text-sm font-medium">
              {warehousesWithCoords.length} відділень на карті
            </span>
          </div>
          {selectedWarehouse && (
            <div className="text-sm text-purple-400">
              Обрано: №{selectedWarehouse.Number}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
