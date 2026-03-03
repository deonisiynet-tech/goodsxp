'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Налаштування</h1>
            <p className="text-muted mt-1">Конфігурація параметрів сайту</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Save size={20} />
            Зберегти
          </button>
        </div>

        {/* Content Placeholder */}
        <div className="card p-12 text-center">
          <SettingsIcon size={64} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-primary mb-2">Налаштування сайту</h2>
          <p className="text-muted">
            Тут буде форма для редагування налаштувань сайту: контакти, SEO, банери тощо
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
