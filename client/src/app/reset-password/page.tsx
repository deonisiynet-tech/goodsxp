import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata = {
  title: 'Скинути пароль | GoodsXP',
  description: 'Введіть новий пароль для вашого облікового запису GoodsXP.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
          <div className="text-muted">Завантаження...</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
