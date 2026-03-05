import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";
import {
  Heart,
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

function getImg(v: CatalogVariant) {
  return (
    (v as any).image_url ||
    (v as any).base_image_url ||
    "https://placehold.co/600x800?text=SmartShop"
  );
}

export default function FavoritesPage() {
  const [items, setItems] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"relevance" | "price_asc" | "price_desc">(
    "relevance"
  );

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(
    null
  );
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await authedFetch("/api/favorites/products");
      if (!r.ok) {
        setItems([]);
        setLoading(false);
        return;
      }
      const json = await r.json();
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setItems([]);
      showToast("error", "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewItems = useMemo(() => {
    let arr = [...items];

    const qq = q.trim().toLowerCase();
    if (qq) {
      arr = arr.filter((v) =>
        String((v as any).title ?? "")
          .toLowerCase()
          .includes(qq)
      );
    }

    if (sort === "price_asc") {
      arr.sort((a, b) => ((a as any).price_kzt ?? 0) - ((b as any).price_kzt ?? 0));
    } else if (sort === "price_desc") {
      arr.sort((a, b) => ((b as any).price_kzt ?? 0) - ((a as any).price_kzt ?? 0));
    }

    return arr;
  }, [items, q, sort]);

  const toggleFavorite = async (variantId: string) => {
    if (!variantId) return showToast("error", "Нет variant_id");

    // оптимистично убираем из списка (на странице избранного это логично)
    const prev = items;
    setItems((p) => p.filter((x: any) => String(x.variant_id) !== String(variantId)));

    try {
      const r = await authedFetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!r.ok) {
        setItems(prev);
        return showToast("info", "Нужно войти в аккаунт");
      }

      const json = await r.json().catch(() => ({}));
      const active = Boolean((json as any)?.active);

      // если внезапно active=true (т.е. добавили), возвращаем назад
      if (active) setItems(prev);

      showToast("success", active ? "Добавлено в избранное" : "Убрано из избранного");
    } catch {
      setItems(prev);
      showToast("error", "Ошибка сети");
    }
  };

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

      <main className="mx-auto max-w-[1680px] px-6 py-10 sm:px-8 lg:px-10">
        {/* Header row like catalog */}
        <header className="mb-10 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-gray-900">
              Избранное
            </h1>
            <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-gray-500">
              Ваши сохранённые модели{" "}
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />{" "}
              <span className="font-black text-emerald-600">
                {viewItems.length} шт.
              </span>
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-[760px] md:flex-row md:items-center md:justify-end">
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
                placeholder="Поиск по избранному..."
                className="h-12 w-full rounded-2xl border border-gray-100 bg-white pl-12 pr-4 text-[15px] font-semibold shadow-sm outline-none transition-all focus:border-emerald-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="h-12 w-full md:w-[240px] appearance-none rounded-2xl border border-gray-100 bg-white px-5 text-[15px] font-black shadow-sm outline-none transition-all focus:border-emerald-500"
            >
              <option value="relevance">По умолчанию</option>
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
            </select>

            {/* Back to catalog */}
            <Link
              href="/catalog"
              className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[14px] font-black text-gray-700 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <ShoppingBag size={18} />
              В каталог
            </Link>
          </div>
        </header>

        {/* Body */}
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
              <Heart size={56} />
            </div>
            <h3 className="text-2xl font-black text-white">Пока пусто</h3>
            <p className="mt-2 text-[15px] font-medium text-gray-500">
              Добавляй понравившиеся модели в избранное — они появятся здесь.
            </p>
            <Link
              href="/catalog"
              className="mt-7 rounded-2xl bg-gray-900 px-7 py-3.5 text-[15px] font-black text-white transition hover:bg-gray-800"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {viewItems.map((item) => {
              const variantId = String((item as any).variant_id ?? "");
              const productId = String((item as any).product_id ?? "");
              const price = Number((item as any).price_kzt ?? 0);

              return (
                <motion.div layout key={variantId || productId} className="group">
                  <Link
                    href={productId ? `/product/${encodeURIComponent(productId)}?variant=${encodeURIComponent(variantId)}` : "#"}
                    className="flex h-full flex-col rounded-[36px] border border-transparent bg-white p-6 transition-all hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100/40"
                  >
                    {/* Image + remove favorite */}
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
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600 shadow-sm transition-all hover:bg-rose-100"
                        aria-label="Убрать из избранного"
                        title="Убрать из избранного"
                      >
                        <Heart size={22} className="fill-current opacity-100" />
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
                              {formatPrice(Math.round(price * 0.05))} с учетом кешбэка
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

                      <div className="text-[12px] font-bold text-gray-500">
                        {(item as any).memory_gb ? `${(item as any).memory_gb}GB` : ""}{" "}
                        {(item as any).color ? `• ${(item as any).color}` : ""}
                      </div>
                    </div>

                    {/* Buy */}
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
      </main>
    </div>
  );
}