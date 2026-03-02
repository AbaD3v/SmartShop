// src/pages/catalog/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";

function normalizeCatalogResponse(json: any): CatalogVariant[] {
  // Поддерживаем:
  // 1) массив
  // 2) { data: массив }
  // 3) { items: массив } (на всякий)
  const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.items) ? json.items : [];
  return arr as CatalogVariant[];
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const loadCatalog = async (nextBrand: string, nextQ: string) => {
    setLoading(true);
    setMessage(null);

    // отменяем прошлый запрос
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const params = new URLSearchParams();
      if (nextBrand) params.set("brand", nextBrand);
      if (nextQ) params.set("q", nextQ);

      const res = await fetch(`/api/catalog/products?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      const list = normalizeCatalogResponse(json);

      setItems(list);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setItems([]);
        setMessage("Не удалось загрузить каталог. Обнови страницу.");
      }
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadCatalog(brand, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload with debounce on filters
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      loadCatalog(brand, q);
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, q]);

  const brands = useMemo(() => {
    // items всегда массив, но всё равно аккуратно
    return Array.from(new Set((items ?? []).map((item) => item.brand))).filter(Boolean).sort();
  }, [items]);

  const addToCart = async (variantId: string) => {
    setMessage(null);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (res.ok) {
        setMessage("Добавлено в корзину ✅");
      } else if (res.status === 401) {
        setMessage("Нужно войти в аккаунт, чтобы добавить в корзину.");
      } else {
        setMessage("Не удалось добавить в корзину.");
      }
    } catch {
      setMessage("Сеть недоступна. Попробуй ещё раз.");
    }
  };

  return (
    <main className="container-shell py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Каталог смартфонов</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Минималистичный каталог в стиле Apple Store: чисто, удобно, быстро.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <input
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 outline-none transition focus:border-gray-300"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по модели (например: iPhone, S24)"
        />

        <select
          className="h-11 rounded-xl border border-gray-200 bg-white px-3 outline-none transition focus:border-gray-300"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        >
          <option value="">Все бренды</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-end">
          <Link href="/cart" className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            Открыть корзину
          </Link>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="card-surface p-4">
              <div className="mb-3 h-40 w-full animate-pulse rounded-xl bg-gray-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-100" />
              <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-surface p-8">
          <p className="text-lg font-medium">Ничего не найдено</p>
          <p className="mt-1 text-sm text-gray-600">
            Попробуй изменить поиск или выбрать другой бренд.
          </p>
          <button
            type="button"
            onClick={() => {
              setBrand("");
              setQ("");
            }}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.variant_id}
              className="card-surface p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                src={item.image_url || "https://placehold.co/400x280?text=Smartphone"}
                alt={item.title}
                className="mb-3 h-40 w-full rounded-xl object-cover"
                loading="lazy"
              />

              <p className="text-xs text-gray-500">{item.brand}</p>
              <h3 className="mt-0.5 text-base font-medium">{item.title}</h3>
              <p className="text-sm text-gray-600">
                {item.memory_gb} ГБ · {item.color}
              </p>

              <p className="mt-2 text-lg font-semibold">{formatPrice(item.price_kzt)}</p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => addToCart(item.variant_id)}
                  className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  В корзину
                </button>
                <Link
                  href={`/product/${item.product_id}`}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Открыть
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}