// src/components/RecommendedProducts.tsx
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";

function normalizeCatalogResponse(json: any): CatalogVariant[] {
  const arr = Array.isArray(json) ? json : json?.data || json?.items || [];
  return arr as CatalogVariant[];
}

function pickImage(v: CatalogVariant) {
  return (
    (v as any).image_url ||
    (v as any).base_image_url ||
    "https://placehold.co/600x800?text=No+Image"
  );
}

function titleOf(v: CatalogVariant) {
  return (
    (v as any).title ||
    [(v as any).brand, (v as any).product_name].filter(Boolean).join(" ") ||
    "Товар"
  );
}

function calcMonthly(price: number, months = 24) {
  if (!price || price <= 0) return 0;
  return Math.max(1, Math.round(price / months));
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  onAdded?: () => void;            // чтобы страница корзины могла обновиться
  title?: string;                 // "Рекомендуем"
  subtitle?: string;              // "Популярное в Астане"
  limit?: number;                 // сколько карточек
  showAllHref?: string;           // куда ведёт "Показать все"
};

export function RecommendedProducts({
  onAdded,
  title = "Рекомендуем",
  subtitle = "Популярное в Астане",
  limit = 6,
  showAllHref = "/catalog",
}: Props) {
  const [items, setItems] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // грузим реальные товары из твоего API каталога
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // берём побольше, потом выберем "рекомендации"
        const res = await fetch(`/api/catalog/products?limit=36`);
        const json = await res.json().catch(() => ({}));
        const list = normalizeCatalogResponse(json);

        // фильтр: только активные + с ценой + с variant_id
        const cleaned = list.filter((v: any) => {
          const price = Number(v.price_kzt ?? 0);
          return Boolean(v.variant_id) && price > 0 && v.is_active !== false && v.product_is_active !== false;
        });

        if (!alive) return;

        // нет поля "популярность" — поэтому делаем “умную” рекомендацию:
        // 1) чуть перемешиваем
        // 2) берем mix дешёвых/средних/дорогих, чтобы блок выглядел живым
        const sorted = [...cleaned].sort((a: any, b: any) => Number(a.price_kzt ?? 0) - Number(b.price_kzt ?? 0));
        const third = Math.max(1, Math.floor(sorted.length / 3));
        const low = shuffle(sorted.slice(0, third)).slice(0, Math.ceil(limit / 3));
        const mid = shuffle(sorted.slice(third, third * 2)).slice(0, Math.ceil(limit / 3));
        const high = shuffle(sorted.slice(third * 2)).slice(0, Math.ceil(limit / 3));

        const mixed = shuffle([...low, ...mid, ...high]).slice(0, limit);

        setItems(mixed);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Не удалось загрузить рекомендации");
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [limit]);

  const addToCart = async (variantId: string) => {
    setAddingId(variantId);
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (res.ok) onAdded?.();
      // если 401 — страница корзины сама покажет “нужно войти” (если у тебя так сделано)
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-gray-100 animate-pulse" />
          <div className="h-5 w-28 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-[340px] rounded-[28px] bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error || items.length === 0) {
    return null; // чтобы не портить UI корзины, если нечего показывать
  }

  return (
    <section className="mt-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-gray-500">{subtitle}</p>
        </div>

        <Link href={showAllHref} className="text-sm font-bold text-emerald-700 hover:underline">
          Показать все
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {items.map((v: any, idx) => {
          const id = String(v.variant_id);
          const price = Number(v.price_kzt ?? 0);
          const cashback = Math.round(price * 0.05);

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-[28px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold text-white">
                  0-0-24
                </span>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-400 hover:text-rose-500"
                  aria-label="В избранное"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>

              <Link href={`/product/${id}`} className="mt-3 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pickImage(v)}
                  alt={titleOf(v)}
                  className="mx-auto h-40 w-40 object-contain"
                  loading="lazy"
                />
              </Link>

              <div className="mt-3">
                <Link href={`/product/${id}`} className="block text-sm font-bold text-gray-900 hover:underline">
                  {titleOf(v)}
                </Link>

                <div className="mt-3 text-lg font-black text-gray-900">{formatPrice(price)}</div>

                <div className="mt-2 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700">
                  {formatPrice(cashback)} <span className="text-slate-400">с учетом кешбека</span>
                </div>

                <div className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                  от {formatPrice(calcMonthly(price))} /мес × 24
                </div>

                <button
                  onClick={() => addToCart(id)}
                  disabled={addingId === id}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {addingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  Купить
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}