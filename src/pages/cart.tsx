import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CartResponse } from "@/lib/types";

function asCartResponse(v: any): CartResponse | null {
  // Поддержим 2 формата API:
  // 1) { items: [...] }
  // 2) { cart: { items: [...] } }
  const candidate = v?.items ? v : v?.cart;
  if (!candidate) return null;
  const items = candidate?.items;
  if (!Array.isArray(items)) return { ...candidate, items: [] };
  return candidate;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyVariant, setBusyVariant] = useState<string | null>(null);
  const mounted = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      const json = await res.json();
      setCart(asCartResponse(json));
    } catch {
      setCart({ items: [] } as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    load();
  }, []);

  const items = cart?.items ?? [];

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price_kzt, 0),
    [items]
  );

  const updateQty = async (variantId: string, quantity: number) => {
    const q = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;

    setBusyVariant(variantId);
    try {
      if (q === 0) {
        await fetch(`/api/cart/items?variantId=${encodeURIComponent(variantId)}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/cart/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity: q }),
        });
      }
      await load();
    } finally {
      setBusyVariant(null);
    }
  };

  if (loading) {
    return (
      <main className="container-shell py-10">
        <h1 className="mb-4 text-3xl font-semibold">Корзина</h1>
        <div className="card-surface p-6 text-sm text-gray-600">Загрузка…</div>
      </main>
    );
  }

  return (
    <main className="container-shell py-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Корзина</h1>
        <Link href="/catalog" className="text-sm text-gray-600 hover:text-gray-900">
          Продолжить покупки
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card-surface p-8">
          <p className="text-lg font-medium">Корзина пустая</p>
          <p className="mt-1 text-sm text-gray-600">
            Добавь смартфон из каталога — он появится здесь.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            {items.map((item) => {
              const isBusy = busyVariant === item.variant_id;
              return (
                <article
                  key={item.variant_id}
                  className="card-surface flex items-center gap-3 p-4"
                >
                  <img
                    src={item.image_url || "https://placehold.co/120x120"}
                    alt={item.title}
                    className="h-20 w-20 rounded-xl object-cover"
                    loading="lazy"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600">
                      {item.memory_gb} ГБ · {item.color}
                    </p>
                    <p className="text-sm font-semibold">{formatPrice(item.price_kzt)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`qty-${item.variant_id}`}>
                      Количество
                    </label>
                    <input
                      id={`qty-${item.variant_id}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="h-10 w-20 rounded-lg border border-gray-200 px-2 text-center"
                      value={item.quantity}
                      disabled={isBusy}
                      onChange={(e) => updateQty(item.variant_id, Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => updateQty(item.variant_id, 0)}
                      title="Удалить"
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="card-surface h-fit p-5">
            <p className="text-sm text-gray-500">Итого</p>
            <p className="mb-4 text-2xl font-semibold">{formatPrice(total)}</p>

            <Link
              href="/checkout"
              className="block rounded-xl bg-slate-900 py-3 text-center text-sm font-medium text-white hover:bg-slate-800"
            >
              Перейти к оформлению
            </Link>

            <p className="mt-3 text-xs text-gray-500">
              Самовывоз из филиала в Астане. Детали уточнишь на следующем шаге.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}