'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      await authApi.forgotPassword(data.email);
      setSuccess(true);
      reset();
      toast.success('Інструкцію надіслано на вашу пошту');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при відправці');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full">
        {/* Back arrow */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted hover:text-purple-400 transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Назад до входу</span>
        </Link>

        <div className="card p-6 sm:p-8">
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-light mb-4">Лист надіслано!</h1>
              <p className="text-muted mb-6">
                Якщо email існує в нашій системі, ви отримаєте посилання для скидання пароля.
              </p>
              <p className="text-sm text-muted mb-6">
                ⏰ Посилання дійсне <strong>15 хвилин</strong>.
              </p>
              <Link href="/login" className="btn-primary inline-block px-8 py-3">
                Повернутися до входу
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-6 mx-auto">
                <Mail size={32} className="text-purple-400" />
              </div>
              <h1 className="text-2xl font-light text-center mb-2">Забули пароль?</h1>
              <p className="text-muted text-center mb-8 text-sm">
                Введіть свій email, і ми надішлемо інструкцію для скидання пароля.
              </p>

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
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 disabled:opacity-50"
                >
                  {loading ? 'Надсилання...' : 'Надіслати інструкцію'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
