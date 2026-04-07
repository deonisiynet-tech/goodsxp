'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const response = await authApi.login(data.email, data.password);

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      toast.success('Вхід виконано успішно!');

      if (response.data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || 'Помилка при вході'
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
          <h1 className="text-2xl font-light text-center mb-8">Вхід в систему</h1>

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
                  {...register('password', { required: 'Пароль обов\'язковий' })}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          <p className="text-center mt-6 text-muted text-sm">
            Немає аккаунта?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Зареєструватися
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
