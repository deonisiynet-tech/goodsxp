'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import toast from 'react-hot-toast'
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Store,
  Mail,
  DollarSign,
  Power,
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Copy,
  Check,
} from 'lucide-react'
import StoreDisableConfirmModal from '@/components/admin/StoreDisableConfirmModal'

interface Settings {
  storeName: string
  contactEmail: string
  currency: string
  storeEnabled: boolean
}

const defaultSettings: Settings = {
  storeName: 'GoodsXP',
  contactEmail: '',
  currency: 'UAH',
  storeEnabled: true,
}

const currencies = [
  { code: 'UAH', symbol: '₴', name: 'Гривня' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'PLN', symbol: 'zł', name: 'Польский злотый' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Settings>(defaultSettings)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [pendingStoreEnabled, setPendingStoreEnabled] = useState<boolean | null>(null)

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [twoFASecret, setTwoFASecret] = useState('')
  const [twoFAToken, setTwoFAToken] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSettings()
    load2FAStatus()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load settings')
      }

      const settings = await response.json()
      setForm({
        storeName: settings.storeName || 'GoodsXP',
        contactEmail: settings.contactEmail || '',
        currency: settings.currency || 'UAH',
        storeEnabled: settings.storeEnabled !== false,
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Помилка завантаження налаштувань')
    } finally {
      setLoading(false)
    }
  }

  const load2FAStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/2fa/status', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setTwoFAEnabled(data.twoFAEnabled)
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Save each setting individually via API
      const settingsToUpdate = [
        { key: 'storeName', value: form.storeName || 'GoodsXP' },
        { key: 'contactEmail', value: form.contactEmail || '' },
        { key: 'currency', value: form.currency || 'UAH' },
        { key: 'storeEnabled', value: form.storeEnabled ? 'true' : 'false' },
      ]

      for (const setting of settingsToUpdate) {
        if (setting.value === undefined || setting.value === null) {
          throw new Error(`Значення для ${setting.key} не може бути пустим`)
        }

        const response = await fetch(`/api/admin/settings/${setting.key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: String(setting.value),
          }),
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to save ${setting.key}`)
        }
      }

      toast.success('Налаштування збережено')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Помилка при збереженні')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate2FA = async () => {
    try {
      setTwoFALoading(true)
      const response = await fetch('/api/admin/auth/2fa/generate', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Помилка генерації 2FA')
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setTwoFASecret(data.secret)
      setShowQR(true)
      toast.success('Секрет 2FA згенеровано. Відскануйте QR-код.')
    } catch (error: any) {
      toast.error(error.message || 'Помилка генерації 2FA')
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      toast.error('Введіть 6-значний код з Google Authenticator')
      return
    }

    try {
      setTwoFALoading(true)
      const response = await fetch('/api/admin/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: twoFAToken }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Помилка активації 2FA')
      }

      setTwoFAEnabled(true)
      setShowQR(false)
      setTwoFAToken('')
      toast.success('2FA успішно увімкнено!')
    } catch (error: any) {
      toast.error(error.message || 'Помилка активації 2FA')
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      toast.error('Введіть 6-значний код з Google Authenticator')
      return
    }

    try {
      setTwoFALoading(true)
      const response = await fetch('/api/admin/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: twoFAToken }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Помилка вимкнення 2FA')
      }

      setTwoFAEnabled(false)
      setShowQR(false)
      setTwoFASecret('')
      setQrCode('')
      setTwoFAToken('')
      toast.success('2FA успішно вимкнено')
    } catch (error: any) {
      toast.error(error.message || 'Помилка вимкнення 2FA')
    } finally {
      setTwoFALoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(twoFASecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Секрет скопійовано')
  }

  const handleStoreEnabledToggle = async (enable: boolean) => {
    try {
      if (enable) {
        const response = await fetch('/api/admin/settings/storeEnabled', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: 'true' }),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to enable store')
        }

        setForm({ ...form, storeEnabled: true })
        toast.success('Магазин включено')
      } else {
        setPendingStoreEnabled(false)
        setShowDisableModal(true)
      }
    } catch (error: any) {
      console.error('Error toggling store:', error)
      toast.error(error.message || 'Помилка при зміні статусу')
    }
  }

  const handleDisableConfirm = async () => {
    try {
      const response = await fetch('/api/admin/settings/storeEnabled', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 'false' }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to disable store')
      }

      setForm({ ...form, storeEnabled: false })
      setShowDisableModal(false)
      setPendingStoreEnabled(null)
      toast.success('Магазин вимкнено')
    } catch (error: any) {
      console.error('Error disabling store:', error)
      toast.error(error.message || 'Помилка при вимкненні магазину')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Налаштування</h1>
            <p className="text-muted mt-1">Конфігурація параметрів сайту</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadSettings} className="btn-secondary flex items-center gap-2" disabled={saving}>
              <RefreshCw size={20} />
              Оновити
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={saving}>
              <Save size={20} />
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </div>

        {/* 2FA Section */}
        <div className="card p-6 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                <Shield className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Двофакторна автентифікація (2FA)</h3>
                <p className="text-sm text-muted">Додатковий захист для входу в адмін-панель</p>
              </div>
            </div>
            {twoFAEnabled && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <ShieldCheck className="text-green-400" size={16} />
                <span className="text-green-400 text-sm font-medium">Увімкнено</span>
              </div>
            )}
          </div>

          {/* 2FA Setup */}
          {!twoFAEnabled && !showQR && (
            <div className="space-y-4">
              <p className="text-slate-300">
                2FA додає додатковий крок безпеки при вході. Після налаштування вам потрібно буде вводити код з Google Authenticator.
              </p>
              <button
                onClick={handleGenerate2FA}
                disabled={twoFALoading}
                className="btn-primary flex items-center gap-2"
              >
                <QrCode size={20} />
                {twoFALoading ? 'Генерація...' : 'Налаштувати 2FA'}
              </button>
            </div>
          )}

          {/* QR Code Display */}
          {showQR && !twoFAEnabled && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl p-6 text-center">
                <p className="text-white font-medium mb-4">1. Відскануйте QR-код у Google Authenticator</p>
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="mx-auto rounded-xl border-2 border-primary/30"
                    width={200}
                    height={200}
                  />
                )}
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6">
                <p className="text-white font-medium mb-3">2. Або введіть секрет вручну</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 px-4 py-2 rounded-lg text-primary font-mono">
                    {twoFASecret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Копіювати секрет"
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6">
                <p className="text-white font-medium mb-3">3. Введіть код з додатку для підтвердження</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={twoFAToken}
                    onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleEnable2FA}
                    disabled={twoFALoading || twoFAToken.length !== 6}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    <ShieldCheck size={20} />
                    {twoFALoading ? 'Перевірка...' : 'Увімкнути 2FA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2FA Enabled State */}
          {twoFAEnabled && (
            <div className="space-y-4">
              <p className="text-slate-300">
                ✅ 2FA увімкнено. При вході в адмін-панель потрібно буде вводити код з Google Authenticator.
              </p>
              <div className="bg-slate-900/50 rounded-xl p-6">
                <p className="text-white font-medium mb-3">Для вимкнення введіть код з додатку</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={twoFAToken}
                    onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={handleDisable2FA}
                    disabled={twoFALoading || twoFAToken.length !== 6}
                    className="btn-danger flex items-center gap-2 px-6"
                  >
                    <ShieldOff size={20} />
                    {twoFALoading ? 'Вимкнення...' : 'Вимкнути 2FA'}
                  </button>
                </div>
              </div>
            </div>
          )}
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
                <h3 className="font-semibold text-white">Назва магазину</h3>
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
                <h3 className="font-semibold text-white">Контактний email</h3>
                <p className="text-sm text-muted">Для зв&apos;язку з клієнтами</p>
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
                <h3 className="font-semibold text-white">Валюта</h3>
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
                <h3 className="font-semibold text-white">Статус магазину</h3>
                <p className="text-sm text-muted">Включений чи вимкнений</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleStoreEnabledToggle(true)}
                disabled={form.storeEnabled}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  form.storeEnabled
                    ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400'
                    : 'bg-surface border border-border text-muted hover:border-green-500/30'
                }`}
              >
                ✅ Включений
              </button>
              <button
                onClick={() => handleStoreEnabledToggle(false)}
                disabled={!form.storeEnabled}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  !form.storeEnabled
                    ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
                    : 'bg-surface border border-border text-muted hover:border-red-500/30'
                }`}
              >
                ❌ Вимкнений
              </button>
            </div>

            {!form.storeEnabled && (
              <p className="text-sm text-red-400 mt-3 flex items-center gap-2">
                ⚠️ Магазин вимкнено - відвідувачі бачать сторінку технічних робіт
              </p>
            )}

            {form.storeEnabled && (
              <p className="text-sm text-green-400 mt-3 flex items-center gap-2">
                ✅ Магазин працює у звичайному режимі
              </p>
            )}
          </div>
        </div>

        {/* Modals */}
        <StoreDisableConfirmModal
          isOpen={showDisableModal}
          onClose={() => {
            setShowDisableModal(false)
            setPendingStoreEnabled(null)
          }}
          onConfirm={handleDisableConfirm}
        />
      </div>
    </AdminLayout>
  )
}
