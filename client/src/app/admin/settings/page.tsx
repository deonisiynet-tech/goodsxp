'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Save, RefreshCw, Store, Mail, DollarSign, Power } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  description?: string | null;
  type: string;
}

interface SettingsForm {
  storeName: string;
  contactEmail: string;
  currency: string;
  storeEnabled: string;
}

const defaultSettings: SettingsForm = {
  storeName: 'GoodsXP',
  contactEmail: '',
  currency: 'UAH',
  storeEnabled: 'true',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSettings();
      const settingsData = response.data;
      setSettings(settingsData);

      // Parse settings into form
      const parsed: SettingsForm = {
        storeName: settingsData['storeName'] || defaultSettings.storeName,
        contactEmail: settingsData['contactEmail'] || defaultSettings.contactEmail,
        currency: settingsData['currency'] || defaultSettings.currency,
        storeEnabled: settingsData['storeEnabled'] ?? defaultSettings.storeEnabled,
      };
      setForm(parsed);
    } catch (error) {
      toast.error('Помилка завантаження налаштувань');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await Promise.all([
        adminApi.updateSetting('storeName', form.storeName, 'Назва магазину'),
        adminApi.updateSetting('contactEmail', form.contactEmail, 'Контактний email'),
        adminApi.updateSetting('currency', form.currency, 'Валюта магазину'),
        adminApi.updateSetting('storeEnabled', form.storeEnabled, 'Магазин включений'),
      ]);

      toast.success('Налаштування збережено');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при збереженні');
    } finally {
      setSaving(false);
    }
  };

  const currencies = [
    { code: 'UAH', symbol: '₴', name: 'Гривня' },
    { code: 'USD', symbol: '$', name: 'Долар США' },
    { code: 'EUR', symbol: '€', name: 'Євро' },
    { code: 'PLN', symbol: 'zł', name: 'Польський злотий' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Налаштування</h1>
            <p className="text-muted mt-1">Конфігурація параметрів сайту</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={loadSettings} 
              className="btn-secondary flex items-center gap-2"
              disabled={saving}
            >
              <RefreshCw size={20} />
              Оновити
            </button>
            <button 
              onClick={handleSave} 
              className="btn-primary flex items-center gap-2"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </div>

        {/* Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store Name */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <Store className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Назва магазину</h3>
                <p className="text-sm text-muted">Відображається на сайті</p>
              </div>
            </div>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="input-field"
              placeholder="Назва магазину"
            />
          </div>

          {/* Contact Email */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <Mail className="text-green-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Контактний email</h3>
                <p className="text-sm text-muted">Для зв'язку з клієнтами</p>
              </div>
            </div>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="input-field"
              placeholder="contact@store.com"
            />
          </div>

          {/* Currency */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <DollarSign className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Валюта</h3>
                <p className="text-sm text-muted">Основна валюта магазину</p>
              </div>
            </div>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="input-field"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.name} ({curr.code} - {curr.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Store Status */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <Power className="text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Статус магазину</h3>
                <p className="text-sm text-muted">Включений чи вимкнений</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="storeEnabled"
                  value="true"
                  checked={form.storeEnabled === 'true'}
                  onChange={(e) => setForm({ ...form, storeEnabled: e.target.value })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-green-400 font-medium">Включений</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="storeEnabled"
                  value="false"
                  checked={form.storeEnabled === 'false'}
                  onChange={(e) => setForm({ ...form, storeEnabled: e.target.value })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-red-400 font-medium">Вимкнений</span>
              </label>
            </div>
            {form.storeEnabled === 'false' && (
              <p className="text-sm text-yellow-500 mt-3">
                ⚠️ Магазин буде недоступний для покупців
              </p>
            )}
          </div>
        </div>

        {/* Current Settings Info */}
        <div className="card p-6">
          <h3 className="font-semibold text-primary mb-4">Поточні налаштування в базі</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surfaceLight">
                <tr>
                  <th className="px-4 py-2 text-left">Ключ</th>
                  <th className="px-4 py-2 text-left">Значення</th>
                  <th className="px-4 py-2 text-left">Опис</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settings.map((setting) => (
                  <tr key={setting.key}>
                    <td className="px-4 py-3 font-mono text-primary">{setting.key}</td>
                    <td className="px-4 py-3">{setting.value}</td>
                    <td className="px-4 py-3 text-muted">{setting.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
