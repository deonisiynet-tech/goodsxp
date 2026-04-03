'use client';

import { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  BarChart3,
  Menu,
  X,
  LogOut,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminPagePath, getAdminApiPath, getAdminBasePath } from '@/lib/admin-paths';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Отримуємо базовий шлях адмінки
  const adminPath = getAdminBasePath();

  const menuItems = [
    { href: getAdminPagePath(''), icon: Home, label: 'Dashboard' },
    { href: getAdminPagePath('/products'), icon: Package, label: 'Товари' },
    { href: getAdminPagePath('/orders'), icon: ShoppingCart, label: 'Замовлення' },
    { href: getAdminPagePath('/users'), icon: Users, label: 'Користувачі' },
    { href: getAdminPagePath('/logs'), icon: FileText, label: 'Логи' },
    { href: getAdminPagePath('/settings'), icon: Settings, label: 'Налаштування' },
  ];

  const isActive = (href: string) => {
    if (href === adminPath) {
      return pathname === adminPath;
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    if (!confirm('Ви впевнені, що хочете вийти?')) return;

    try {
      setLoggingOut(true);

      const response = await fetch(getAdminApiPath('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Помилка виходу');
      }

      toast.success('Вихід виконано успішно');
      router.push(getAdminPagePath('/login'));
    } catch (error: any) {
      toast.error(error.message || 'Помилка виходу');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surfaceLight border-r border-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <h1 className="text-xl font-bold text-white">GoodsXP</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted hover:text-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-white border border-primary/20'
                    : 'text-white hover:text-primary hover:bg-surface'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-white hover:text-primary hover:bg-surface rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={20} className={loggingOut ? 'animate-pulse' : ''} />
              <span className="font-medium">{loggingOut ? 'Вихід...' : 'Вийти'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center h-16 px-6 border-b border-border bg-surfaceLight">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted hover:text-primary"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <BarChart3 size={16} className="text-white" />
              </div>
              <span className="text-sm text-muted">Admin Panel</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
