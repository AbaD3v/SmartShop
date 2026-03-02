import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';

type OrderItem = { id: string; title_snapshot: string; qty: number; unit_price_kzt: number };
type OrderDetail = { id: string; created_at: string; items: OrderItem[] };

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`).then((r) => r.json()).then(setOrder);
  }, [id]);

  if (!order) return <main className="container-shell py-10">Загрузка...</main>;

  return (
    <main className="container-shell py-10">
      <h1 className="mb-3 text-3xl font-semibold">Заказ #{order.id.slice(0, 8)}</h1>
      <p className="mb-5 text-sm text-gray-600">{new Date(order.created_at).toLocaleString('ru-RU')}</p>
      <div className="card-surface p-5">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-gray-100 py-2 last:border-none">
            <span>{item.title_snapshot} × {item.qty}</span>
            <strong>{formatPrice(item.qty * item.unit_price_kzt)}</strong>
          </div>
        ))}
      </div>
    </main>
  );
}
