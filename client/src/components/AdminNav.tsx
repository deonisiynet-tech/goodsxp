'use client';

import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react';

type Tab = 'overview' | 'products' | 'orders';

interface AdminNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function AdminNav({ activeTab, setActiveTab }: AdminNavProps) {
  return (
    <aside className="w-64 bg-surface border-r border-border p-4 hidden md:block">
      <nav className="space-y-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
            activeTab === 'overview'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-primary hover:bg-surfaceLight'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Огляд</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
            activeTab === 'products'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-primary hover:bg-surfaceLight'
          }`}
        >
          <Package size={20} />
          <span>Товари</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
            activeTab === 'orders'
              ? 'bg-primary text-background'
              : 'text-muted hover:text-primary hover:bg-surfaceLight'
          }`}
        >
          <ShoppingCart size={20} />
          <span>Замовлення</span>
        </button>
      </nav>
    </aside>
  );
}
