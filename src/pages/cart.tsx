import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { CartResponse } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);

  const load = () => fetch('/api/cart').then((r) => r.json()).then(setCart);
  useEffect(() => { load(); }, []);

  const total = useMemo(() => (cart?.items || []).reduce((sum, i) => sum + i.quantity * i.price_kzt, 0), [cart]);

  const updateQty = async (variantId: string, quantity: number) => {
    await fetch('/api/cart/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variantId, quantity }) });
    load();
  };

  if (!cart) return <main className="container-shell py-10">Загрузка...</main>;

  return (
    <main className="container-shell py-10">
      <h1 className="mb-4 text-3xl font-semibold">Корзина</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          {cart.items.map((item) => (
            <article key={item.variant_id} className="card-surface flex items-center gap-3 p-4">
              <img src={item.image_url || 'https://placehold.co/120x120'} alt={item.title} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.memory_gb} ГБ · {item.color}</p>
                <p className="text-sm font-semibold">{formatPrice(item.price_kzt)}</p>
              </div>
              <input type="number" min={0} className="h-10 w-20 rounded-lg border border-gray-200 px-2" value={item.quantity} onChange={(e) => updateQty(item.variant_id, Number(e.target.value))} />
            </article>
          ))}
        </section>
        <aside className="card-surface h-fit p-5">
          <p className="text-sm text-gray-500">Итого</p>
          <p className="mb-4 text-2xl font-semibold">{formatPrice(total)}</p>
          <Link href="/checkout" className="block rounded-xl bg-slate-900 py-3 text-center text-sm font-medium text-white">Перейти к оформлению</Link>
        </aside>
      </div>
    </main>
  );
}
