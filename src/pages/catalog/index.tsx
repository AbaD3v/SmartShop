// src/pages/catalog/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";
import {
  Search,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Heart,
} from "lucide-react";
import { Header } from "@/components/layout/Header";

function normalizeCatalogResponse(json: any): CatalogVariant[] {
  const arr = Array.isArray(json) ? json : json?.data || json?.items || [];
  return arr as CatalogVariant[];
}

type ToastKind = "success" | "error" | "info";

function getCardId(v: CatalogVariant) {
  // Страница /product/[id].tsx у тебя грузит по productId и потом фильтрует variants по product_id
  // Поэтому лучше передавать product_id. Если его нет — fallback на variant_id
  return (v as any).product_id ?? (v as any).variant_id ?? "";
}

function getImg(v: CatalogVariant) {
  return (
    (v as any).image_url ||
    (v as any).base_image_url ||
    "https://placehold.co/600x800?text=SmartShop"
  );
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"relevance" | "price_asc" | "price_desc">(
    "relevance"
  );
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(
    null
  );

  // favorites
  const [favIds, setFavIds] = useState<string[]>([]);
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  };

  // ----- FAVORITES -----
  const loadFavorites = async () => {
    try {
      const r = await authedFetch("/api/favorites");
      if (!r.ok) return; // если не залогинен — просто пропускаем
      const data = (await r.json()) as string[];
      setFavIds(Array.isArray(data) ? data : []);
    } catch {
      // не критично
    }
  };

  const toggleFavorite = async (variantId: string) => {
    if (!variantId) return showToast("error", "Нет variant_id");

    // оптимистично
    const was = favSet.has(variantId);
    setFavIds((prev) => (was ? prev.filter((x) => x !== variantId) : [variantId, ...prev]));

    try {
      const r = await authedFetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!r.ok) {
        // откат
        setFavIds((prev) => (was ? [variantId, ...prev] : prev.filter((x) => x !== variantId)));
        return showToast("info", "Нужно войти в аккаунт");
      }

      const json = await r.json().catch(() => ({}));
      const active = Boolean((json as any)?.active);

      // синхронизация
      setFavIds((prev) => {
        const has = prev.includes(variantId);
        if (active && !has) return [variantId, ...prev];
        if (!active && has) return prev.filter((x) => x !== variantId);
        return prev;
      });

      showToast("success", active ? "Добавлено в избранное" : "Убрано из избранного");
    } catch {
      // откат
      setFavIds((prev) => (was ? [variantId, ...prev] : prev.filter((x) => x !== variantId)));
      showToast("error", "Ошибка сети");
    }
  };

  // грузим избранное при первом открытии
  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- CATALOG -----
  const loadCatalog = async (nextBrand: string, nextQ: string) => {
    setLoading(true);
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
      setItems(normalizeCatalogResponse(json));
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setItems([]);
        showToast("error", "Ошибка загрузки данных.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => loadCatalog(brand, q), 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, q]);

  const brands = ["Apple", "Samsung", "Xiaomi", "Google", "Nothing", "OnePlus"];

  const viewItems = useMemo(() => {
    const arr = [...items];

    if (sort === "price_asc") {
      arr.sort((a, b) => ((a as any).price_kzt ?? 0) - ((b as any).price_kzt ?? 0));
    } else if (sort === "price_desc") {
      arr.sort((a, b) => ((b as any).price_kzt ?? 0) - ((a as any).price_kzt ?? 0));
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      return arr.filter((v) =>
        String((v as any).title ?? "")
          .toLowerCase()
          .includes(qq)
      );
    }

    return arr;
  }, [items, sort, q]);

  const addToCart = async (variantId: string) => {
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (res.ok) return showToast("success", "Добавлено в корзину");
      showToast("info", "Нужно войти в аккаунт");
    } catch {
      showToast("error", "Ошибка сети");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-900">

      <main className="mx-auto max-w-[1680px] px-6 py-10 sm:px-8 lg:px-10">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 text-white shadow-2xl"
            >
              {toast.kind === "success" ? (
                <CheckCircle2 className="text-emerald-400" size={20} />
              ) : toast.kind === "error" ? (
                <AlertTriangle className="text-rose-400" size={20} />
              ) : (
                <AlertTriangle className="text-sky-300" size={20} />
              )}
              <span className="text-sm font-bold">{toast.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
          {/* SIDEBAR */}
          <aside className="hidden lg:block space-y-10">
            <div className="rounded-[36px] border border-emerald-100 bg-emerald-50 p-7">
              <div className="mb-3 flex items-center gap-2 text-emerald-700">
                <Sparkles size={20} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Smart-подбор
                </span>
              </div>
              <p className="mb-5 text-[15px] font-medium leading-relaxed text-emerald-900/60">
                Поможем выбрать идеальный смартфон под ваши задачи.
              </p>
              <button className="w-full rounded-2xl bg-emerald-600 py-3.5 text-[15px] font-black text-white transition hover:bg-emerald-700">
                Подобрать
              </button>
            </div>

            <div>
              <h3 className="mb-4 pl-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                Бренды
              </h3>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setBrand("")}
                  className={[
                    "flex items-center rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all",
                    !brand
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                      : "text-gray-600 hover:bg-gray-50",
                  ].join(" ")}
                >
                  Все устройства
                </button>

                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(b)}
                    className={[
                      "flex items-center rounded-2xl px-5 py-3.5 text-[15px] font-black transition-all",
                      brand === b
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                        : "text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 pl-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                Сортировка
              </h3>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="h-12 w-full appearance-none rounded-2xl border border-gray-100 bg-white px-5 text-[15px] font-black shadow-sm outline-none transition-all focus:border-emerald-500"
              >
                <option value="relevance">По популярности</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
              </select>
            </div>
          </aside>

          {/* MAIN */}
          <section>
            <header className="mb-10 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-5xl font-black tracking-tight text-gray-900">
                  Все смартфоны
                </h1>
                <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-gray-500">
                  Доступно в Астане сегодня{" "}
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />{" "}
                  <span className="font-black text-emerald-600">
                    {viewItems.length} моделей
                  </span>
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-[520px] md:flex-row md:items-center md:justify-end">
                {/* Search */}
                <div className="relative w-full md:w-[420px]">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="h-12 w-full rounded-2xl border border-gray-100 bg-white pl-12 pr-4 text-[15px] font-semibold shadow-sm outline-none transition-all focus:border-emerald-500"
                  />
                </div>

                {/* Favorites link */}
                <Link
                  href="/favorites"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[14px] font-black text-gray-700 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <Heart size={18} className="text-rose-500" />
                  Избранное
                  {favIds.length > 0 && (
                    <span className="ml-1 rounded-full bg-rose-50 px-2 py-0.5 text-[12px] font-black text-rose-600">
                      {favIds.length}
                    </span>
                  )}
                </Link>
              </div>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[520px] animate-pulse rounded-[36px] bg-gray-100"
                  />
                ))}
              </div>
            ) : viewItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 rounded-full bg-gray-50 p-7 text-gray-300">
                  <Search size={56} />
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  Ничего не нашли
                </h3>
                <p className="mt-2 text-[15px] font-medium text-gray-500">
                  Попробуйте изменить фильтры или текст поиска
                </p>
                <button
                  onClick={() => {
                    setBrand("");
                    setQ("");
                  }}
                  className="mt-7 rounded-2xl bg-gray-900 px-7 py-3.5 text-[15px] font-black text-white transition hover:bg-gray-800"
                >
                  Сбросить всё
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {viewItems.map((item) => {
                  const cardId = getCardId(item);
                  const variantId = String((item as any).variant_id ?? "");
                  const price = Number((item as any).price_kzt ?? 0);
                  const isFav = favSet.has(variantId);

                  return (
                    <motion.div
                      layout
                      key={variantId || cardId}
                      className="group"
                    >
                      {/* Вся карточка кликабельна */}
                      <Link
                        href={cardId ? `/product/${encodeURIComponent(cardId)}` : "#"}
                        className="flex h-full flex-col rounded-[36px] border border-transparent bg-white p-6 transition-all hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100/40"
                      >
                        {/* Image + like */}
                        <div className="relative mb-7 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-3xl bg-[#F9F9F9]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImg(item)}
                            alt={String((item as any).title ?? "Товар")}
                            className="h-[84%] w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(variantId);
                            }}
                            className={[
                              "absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-all",
                              isFav
                                ? "bg-rose-50 text-rose-600"
                                : "bg-white text-gray-300 hover:text-rose-500",
                            ].join(" ")}
                            aria-label={isFav ? "Убрать из избранного" : "В избранное"}
                          >
                            <Heart
                              size={22}
                              className={[
                                "transition",
                                isFav
                                  ? "fill-current opacity-100"
                                  : "fill-current opacity-20 group-hover:opacity-100",
                              ].join(" ")}
                            />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                              {String((item as any).brand ?? "")}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-600">
                              0-0-24
                            </span>
                          </div>

                          <h3 className="min-h-[3.2rem] line-clamp-2 text-[17px] font-black leading-snug text-gray-900">
                            {String((item as any).title ?? "Товар")}
                          </h3>

                          <div className="pt-1">
                            <p className="text-3xl font-black text-gray-900">
                              {formatPrice(price)}
                            </p>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] text-emerald-600">
                                  ₸
                                </span>
                                <span>
                                  {formatPrice(Math.round(price * 0.05))} с учетом
                                  кешбэка
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px] text-gray-400">
                                  ●
                                </span>
                                <span>
                                  от {formatPrice(Math.round(price / 24))} /мес × 24
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Buy button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!variantId) return showToast("error", "Нет variant_id");
                            addToCart(variantId);
                          }}
                          className="mt-7 flex w-full items-center justify-center gap-2 rounded-3xl bg-[#00C853] py-4 text-[15px] font-black text-white transition-all hover:bg-[#00B44A] active:scale-[0.98]"
                        >
                          <ShoppingBag size={20} />
                          Купить
                        </button>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}