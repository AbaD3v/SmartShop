import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowser } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

type OrderSummary = { id: string; created_at: string; total_kzt: number };
type AuthResult = { data: { user: { email?: string } | null } };

export default function AccountPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then((result: AuthResult) => {
      const user = result.data.user;
      if (!user) return router.replace('/auth?next=/account');
      fetch('/api/orders').then((r) => r.json()).then(setOrders);
    });
  }, [router]);

  return (
    <main className="container-shell py-10">
      <h1 className="mb-5 text-3xl font-semibold">Мои заказы</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link href={`/account/${order.id}`} key={order.id} className="card-surface block p-4">
            <p className="text-sm text-gray-500">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString('ru-RU')}</p>
            <p className="font-medium">{formatPrice(order.total_kzt || 0)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
