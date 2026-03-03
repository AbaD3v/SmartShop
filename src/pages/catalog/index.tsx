// src/pages/catalog/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function normalizeCatalogResponse(json: any): CatalogVariant[] {
  // Поддерживаем:
  // 1) массив
  // 2) { data: массив }
  // 3) { items: массив } (на всякий)
  const arr = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
        ? json.items
        : [];
  return arr as CatalogVariant[];
}

type ToastKind = "success" | "error" | "info";

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [brand, setBrand] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"relevance" | "price_asc" | "price_desc">("relevance");

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  const loadCatalog = async (nextBrand: string, nextQ: string) => {
    setLoading(true);

    // отменяем прошлый запрос
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const params = new URLSearchParams();
      if (nextBrand) params.set("brand", nextBrand);
      if (nextQ) params.set("q", nextQ);

      const res = await fetch(`/api/catalog/products?${params.toString()}`, {
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));
      const list = normalizeCatalogResponse(json);

      setItems(list);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setItems([]);
        showToast("error", "Не удалось загрузить каталог. Обнови страницу.");
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
    }, 280);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, q]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const brands = useMemo(() => {
    return Array.from(new Set((items ?? []).map((item) => item.brand)))
      .filter(Boolean)
      .sort();
  }, [items]);

  const viewItems = useMemo(() => {
    const arr = [...(items ?? [])];

    if (sort === "price_asc") {
      arr.sort((a, b) => (a.price_kzt ?? 0) - (b.price_kzt ?? 0));
    } else if (sort === "price_desc") {
      arr.sort((a, b) => (b.price_kzt ?? 0) - (a.price_kzt ?? 0));
    }

    return arr;
  }, [items, sort]);

  const hasFilters = brand.trim().length > 0 || q.trim().length > 0 || sort !== "relevance";

  const resetFilters = () => {
    setBrand("");
    setQ("");
    setSort("relevance");
    showToast("info", "Фильтры сброшены.");
  };

  const addToCart = async (variantId: string) => {
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (res.ok) {
        showToast("success", "Добавлено в корзину ✅");
        return;
      }

      const e = await res.json().catch(() => ({}));
      if (res.status === 401) {
        showToast("info", "Нужно войти в аккаунт, чтобы добавить в корзину.");
      } else {
        showToast("error", e?.error || "Не удалось добавить в корзину.");
      }
    } catch {
      showToast("error", "Сеть недоступна. Попробуй ещё раз.");
    }
  };

  return (
    <main className="container-shell py-10 md:py-14">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Каталог</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Смартфоны
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            Минималистичный каталог в стиле Apple Store: чисто, удобно, быстро.
          </p>
        </div>

        <Link
          href="/cart"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
        >
          <ShoppingBag size={16} />
          Корзина
          <ArrowRight size={16} className="text-gray-500" />
        </Link>
      </div>

      {/* Filters */}
      <section className="card-surface mb-6 p-4 md:mb-8 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-10 text-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по модели (например: iPhone, S24)"
              aria-label="Поиск"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
                aria-label="Очистить поиск"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Brand */}
          <div className="min-w-[220px]">
            <div className="relative">
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-label="Бренд"
              >
                <option value="">Все бренды</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ▾
              </span>
            </div>
          </div>

          {/* Sort */}
          <div className="min-w-[220px]">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ₸
              </span>
              <select
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                aria-label="Сортировка"
              >
                <option value="relevance">По умолчанию</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ▾
              </span>
            </div>
          </div>

          {/* Reset */}
          <div className="md:ml-auto">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>
            {loading ? "Загрузка..." : `Найдено: ${viewItems.length}`}
            {brand ? <span className="ml-1">· Бренд: {brand}</span> : null}
            {q ? <span className="ml-1">· Поиск: “{q}”</span> : null}
          </p>

          <p className="hidden md:block">Совет: открой карточку — там будут варианты памяти/цвета.</p>
        </div>
      </section>

      {/* Toast */}
      {toast ? (
        <div
          className={[
            "mb-6 flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.03)]",
            toast.kind === "success" ? "border-emerald-200" : "",
            toast.kind === "error" ? "border-rose-200" : "",
            toast.kind === "info" ? "border-gray-200" : "",
          ].join(" ")}
          role="status"
        >
          <span className="mt-0.5">
            {toast.kind === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : toast.kind === "error" ? (
              <AlertTriangle size={18} className="text-rose-600" />
            ) : (
              <SlidersHorizontal size={18} className="text-gray-600" />
            )}
          </span>
          <div className="flex-1 text-gray-800">{toast.text}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            aria-label="Закрыть"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="card-surface p-4">
              <div className="mb-3 h-44 w-full animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-100" />
              <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      ) : viewItems.length === 0 ? (
        <div className="card-surface p-8 md:p-10">
          <p className="text-lg font-medium text-gray-900">Ничего не найдено</p>
          <p className="mt-1 text-sm text-gray-600">
            Попробуй изменить поиск или выбрать другой бренд.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Сбросить фильтры
            </button>

            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
            >
              Обновить
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {viewItems.map((item) => (
            <article
              key={item.variant_id}
              className="group card-surface overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-gray-50">
                <img
                  src={item.image_url || "https://placehold.co/800x560?text=Smartphone"}
                  alt={item.title}
                  className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500">{item.brand}</p>
                <h3 className="mt-0.5 line-clamp-2 text-base font-medium tracking-tight text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {item.memory_gb} ГБ · {item.color}
                </p>

                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <p className="text-lg font-semibold tracking-tight text-gray-900">
                    {formatPrice(item.price_kzt)}
                  </p>
                  <Link
                    href={`/product/${item.product_id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 transition hover:bg-gray-50"
                  >
                    Открыть <ArrowRight size={14} className="text-gray-500" />
                  </Link>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(item.variant_id)}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    В корзину
                  </button>

                  <Link
                    href={`/product/${item.product_id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                    aria-label={`Открыть ${item.title}`}
                  >
                    <ArrowRight size={16} className="text-gray-600" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}