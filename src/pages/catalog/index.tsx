import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { CatalogVariant } from '@/lib/types';

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState('');
  const [q, setQ] = useState('');

  const loadCatalog = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (q) params.set('q', q);
    const data = await fetch(`/api/catalog/products?${params.toString()}`).then((r) => r.json());
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, q]);

  const brands = useMemo(() => Array.from(new Set(items.map((item) => item.brand))), [items]);

  const addToCart = async (variantId: string) => {
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, quantity: 1 }),
    });
    alert(res.ok ? 'Добавлено в корзину' : 'Требуется вход в аккаунт');
  };

  return (
    <main className="container-shell py-8">
      <h1 className="mb-6 text-3xl font-semibold md:text-4xl">Каталог смартфонов</h1>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <input className="h-11 rounded-xl border border-gray-200 px-3" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
        <select className="h-11 rounded-xl border border-gray-200 px-3" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Все бренды</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      {loading ? <p>Загрузка...</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.variant_id} className="card-surface p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={item.image_url || 'https://placehold.co/400x280?text=Smartphone'} alt={item.title} className="mb-3 h-40 w-full rounded-xl object-cover" />
              <p className="text-xs text-gray-500">{item.brand}</p>
              <h3 className="text-base font-medium">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.memory_gb} ГБ · {item.color}</p>
              <p className="mt-2 text-lg font-semibold">{formatPrice(item.price_kzt)}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => addToCart(item.variant_id)} className="flex-1 rounded-xl bg-slate-900 py-2 text-sm text-white">В корзину</button>
                <Link href={`/product/${item.product_id}`} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">Открыть</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
