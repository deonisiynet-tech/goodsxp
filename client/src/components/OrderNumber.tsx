'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { formatOrderNumber } from '@/lib/order-utils';

function OrderNumberDisplay() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('order');

  return (
    <p className="text-lg font-medium text-white mt-6 mb-8">
      Номер вашого замовлення: <span className="text-purple-400 font-bold">{formatOrderNumber(orderNumber)}</span>
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
