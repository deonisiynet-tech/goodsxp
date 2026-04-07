'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        {/* ✅ Back arrow */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-purple-400 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">На головну</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-light text-center mb-8">Реєстрація</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
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
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password with eye toggle */}
            <div>
              <label className="block text-sm font-medium mb-1">Пароль</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Пароль обов\'язковий',
                    minLength: { value: 6, message: 'Мінімум 6 символів' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password with eye toggle */}
            <div>
              <label className="block text-sm font-medium mb-1">Підтвердження паролю</label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Підтвердіть пароль',
                    validate: (value) =>
                      value === watch('password') || 'Паролі не співпадають',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
