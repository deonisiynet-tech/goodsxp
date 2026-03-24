'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      const response = await authApi.register(data.email, data.password);

      // Тільки на клієнті зберігаємо токен
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      toast.success('Реєстрація успішна!');
      router.push('/');
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || 'Помилка при реєстрації'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <h1 className="text-2xl font-light text-center mb-8">Реєстрація</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                {...register('email', {
                  required: 'Email обов\'язковий',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некоректний email',
                  },
                })}
                className="input-field"
                placeholder="example@mail.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Пароль
              </label>
              <input
                {...register('password', {
                  required: 'Пароль обов\'язковий',
                  minLength: {
                    value: 6,
                    message: 'Мінімум 6 символів',
                  },
                })}
                type="password"
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Підтвердження паролю
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Підтвердіть пароль',
                  validate: (value) =>
                    value === watch('password') || 'Паролі не співпадають',
                })}
                type="password"
                className="input-field"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Реєстрація...' : 'Зареєструватися'}
            </button>
          </form>

          <p className="text-center mt-6 text-muted text-sm">
            Вже є аккаунт?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
