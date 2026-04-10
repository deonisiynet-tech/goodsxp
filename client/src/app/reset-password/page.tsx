'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [missingToken, setMissingToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setMissingToken(true);
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Відсутній токен для скидання пароля');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword(token, data.newPassword);
      toast.success('Пароль успішно змінено!');
      // Перенаправляємо на логін через 1.5 секунди
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при скиданні пароля');
    } finally {
      setLoading(false);
    }
  };

  if (missingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-muted hover:text-purple-400 transition-colors mb-6 min-h-[44px]"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Назад до входу</span>
          </Link>

          <div className="card p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6 mx-auto">
              <Lock size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-light mb-4">Недійсне посилання</h1>
            <p className="text-muted mb-6">
              Посилання для скидання пароля недійсне або закінчився його термін дії.
            </p>
            <Link href="/forgot-password" className="btn-primary inline-block px-8 py-3">
              Запитати скидання знову
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted hover:text-purple-400 transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Назад до входу</span>
        </Link>

        <div className="card p-6 sm:p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-6 mx-auto">
            <Lock size={32} className="text-purple-400" />
          </div>
          <h1 className="text-2xl font-light text-center mb-2">Новий пароль</h1>
          <p className="text-muted text-center mb-8 text-sm">
            Введіть новий пароль для вашого облікового запису.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Новий пароль</label>
              <div className="relative">
                <input
                  {...register('newPassword', {
                    required: 'Пароль обов\'язковий',
                    minLength: {
                      value: 8,
                      message: 'Мінімум 8 символів',
                    },
                    maxLength: {
                      value: 128,
                      message: 'Максимум 128 символів',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Повторити пароль</label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Підтвердження обов\'язкове',
                    validate: (value) =>
                      value === newPassword || 'Паролі не співпадають',
                  })}
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Зміна...' : 'Змінити пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
