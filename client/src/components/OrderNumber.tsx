'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderNumberDisplay() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('order');

  return (
    <p className="text-lg font-medium text-white mt-6 mb-8">
      Номер вашого замовлення: #{orderNumber || '...'}
    </p>
  );
}

export default function OrderNumber() {
  return (
    <Suspense fallback={
      <p className="text-lg font-medium text-white mt-6 mb-8">
        Номер вашого замовлення: ...
      </p>
    }>
      <OrderNumberDisplay />
    </Suspense>
  );
}
