// src/pages/product/[id].tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { getSupabaseBrowser } from "@/lib/supabase";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  Store,
  Loader2,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

function normalizeSingle(json: any): CatalogVariant | null {
  const item = json?.data?.item ?? json?.item ?? json?.data ?? json ?? null;
  if (!item || typeof item !== "object") return null;
  return item as CatalogVariant;
}

function normalizeList(json: any): CatalogVariant[] {
  const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : Array.isArray(json?.items) ? json.items : [];
  return arr as CatalogVariant[];
}

function pickImage(v?: CatalogVariant | null) {
  return (
    v?.image_url ||
    v?.base_image_url ||
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
  );
}

function clampText(s: string, max = 90) {
  const t = (s ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function calcMonthly(price: number, months = 24) {
  if (!price || price <= 0) return 0;
  return Math.max(1, Math.round(price / months));
}

export default function ProductPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const id = typeof router.query.id === "string" ? router.query.id : undefined;

  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  const load = async (idFromRoute: string) => {
  setLoading(true);
  setToast(null);

  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  try {
    // Пробуем как productId (как сейчас)
    const res = await fetch(
      `/api/catalog/products?productId=${encodeURIComponent(idFromRoute)}`,
      { signal: controller.signal }
    );

    const json = await res.json().catch(() => ({}));
    const list = normalizeList(json);

    // 1) Если id — это product_id
    let filtered = list.filter((x) => String(x.product_id) === String(idFromRoute));

    // 2) Если не нашли — значит id может быть variant_id
    if (filtered.length === 0) {
      filtered = list.filter((x) => String(x.variant_id) === String(idFromRoute));
    }

    // 3) Если всё ещё 0 — fallback: возможно API вернул весь каталог без фильтра,
    // тогда попробуем вытащить по обоим полям прямо из list:
    if (filtered.length === 0) {
      const byProduct = list.find((x) => String(x.product_id) === String(idFromRoute));
      const byVariant = list.find((x) => String(x.variant_id) === String(idFromRoute));

      if (byProduct) filtered = list.filter((x) => String(x.product_id) === String(idFromRoute));
      if (byVariant) filtered = list.filter((x) => String(x.product_id) === String(byVariant.product_id));
    }

    setVariants(filtered);

    // Выбор варианта:
    // - если url был variant_id → выбираем именно его
    // - иначе выбираем первый вариант
    const exactVariant = filtered.find((v) => String(v.variant_id) === String(idFromRoute));
    setSelectedId(exactVariant?.variant_id ?? filtered[0]?.variant_id ?? null);
  } catch (e: any) {
    if (e?.name !== "AbortError") {
      setVariants([]);
      setSelectedId(null);
      showToast("error", "Не удалось загрузить товар. Обнови страницу.");
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!id) return;
    load(id);

    return () => {
      abortRef.current?.abort();
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const product = variants[0] ?? null;

  const selected = useMemo(
    () => variants.find((v) => v.variant_id === selectedId) ?? null,
    [variants, selectedId],
  );

  const title =
    selected?.title ||
    product?.title ||
    [product?.brand, product?.product_name].filter(Boolean).join(" ") ||
    "Товар";

  const price = Number((selected?.price_kzt ?? product?.price_kzt ?? 0) as any);

  const color = (selected?.color ?? product?.color ?? "") as string;
  const storage = (selected?.storage_gb ?? product?.storage_gb ?? null) as number | null;
  const memory = (selected?.memory_gb ?? product?.memory_gb ?? null) as number | null;

  const meta = useMemo(() => {
    const parts: string[] = [];
    if (color) parts.push(color);
    if (storage) parts.push(`${storage}GB`);
    if (memory) parts.push(`${memory}GB RAM`);
    return parts.join(" • ");
  }, [color, storage, memory]);

  const memoryOptions = useMemo(() => {
    const values = Array.from(
      new Set(variants.map((v) => v.memory_gb).filter((x) => typeof x === "number")),
    ) as number[];
    values.sort((a, b) => a - b);
    return values;
  }, [variants]);

  const groupedByMemory = useMemo(() => {
    // map: mem -> variants sorted by price
    const m = new Map<number, CatalogVariant[]>();
    for (const v of variants) {
      const mem = v.memory_gb;
      if (typeof mem !== "number") continue;
      if (!m.has(mem)) m.set(mem, []);
      m.get(mem)!.push(v);
    }
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => (a.price_kzt ?? 0) - (b.price_kzt ?? 0));
      m.set(k, arr);
    }
    return m;
  }, [variants]);

  const activeMem = (selected?.memory_gb ?? product?.memory_gb ?? null) as number | null;

  const colorOptionsForActiveMem = useMemo(() => {
    if (typeof activeMem !== "number") return variants;
    return groupedByMemory.get(activeMem) ?? variants;
  }, [activeMem, groupedByMemory, variants]);

  const setMemory = (mem: number) => {
    const arr = groupedByMemory.get(mem) ?? [];
    const next = arr[0] ?? null;
    if (next?.variant_id) setSelectedId(next.variant_id);
  };

  const setColorVariant = (variantId: string) => setSelectedId(variantId);

  const addToCart = async () => {
    if (!selected?.variant_id) return;

    setAdding(true);
    setToast(null);

    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId: selected.variant_id, quantity: 1 }),
      });

      if (res.ok) {
        showToast("success", "Добавлено в корзину ✅");
      } else {
        const e = await res.json().catch(() => ({}));
        if (res.status === 401) showToast("info", "Нужно войти в аккаунт, чтобы добавить в корзину.");
        else showToast("error", e?.error || "Не удалось добавить в корзину.");
      }
    } catch {
      showToast("error", "Сеть недоступна. Попробуй ещё раз.");
    } finally {
      setAdding(false);
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
            className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-6 py-4 text-white shadow-2xl"
          >
            <div className="flex items-center gap-3">
              {toast.kind === "success" ? (
                <CheckCircle2 size={20} className="text-emerald-400" />
              ) : toast.kind === "error" ? (
                <AlertTriangle size={20} className="text-rose-400" />
              ) : (
                <Info size={20} className="text-sky-300" />
              )}
              <span className="text-sm font-black">{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1920px] px-4 pb-14 pt-10 sm:px-8 lg:px-12 xl:px-16">
        {/* Top nav */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 hover:bg-slate-50"
          >
            <ArrowLeft size={18} className="text-slate-600" />
            Назад
          </Link>

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 hover:bg-slate-50"
          >
            <ShoppingBag size={18} className="text-slate-700" />
            Корзина
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_520px]">
            <div className="rounded-[32px] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
              <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-6 h-[520px] animate-pulse rounded-3xl bg-slate-100" />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-10 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-16 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-8 h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
              <div className="mt-3 h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        ) : !product ? (
          <div className="rounded-[32px] bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <p className="text-2xl font-black text-slate-900">Товар не найден</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">Возможно, ссылка устарела.</p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-900 hover:bg-slate-200"
            >
              <ArrowLeft size={18} />
              Вернуться в каталог
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_520px]">
            {/* LEFT: Gallery + details */}
            <section className="rounded-[32px] bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[12px] font-black uppercase tracking-widest text-emerald-600">
                    {product.brand ?? "Бренд"}
                  </div>
                  <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                    {title}
                  </h1>
                  {meta ? (
                    <div className="mt-3 text-sm font-bold text-slate-500">{meta}</div>
                  ) : null}
                </div>

                <button
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 hover:bg-slate-200"
                  aria-label="В избранное"
                >
                  <Heart className="h-6 w-6 text-slate-500" />
                </button>
              </div>

              <div className="mt-8 overflow-hidden rounded-[28px] bg-slate-50 p-6 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                    0-0-24
                  </span>
                  <span className="text-xs font-black text-slate-500">
                    SKU: {selected?.sku ?? product.sku ?? "—"}
                  </span>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pickImage(selected ?? product)}
                  alt={title}
                  className="mx-auto mt-6 h-[460px] w-[460px] max-w-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Quick blocks */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Рассрочка
                  </p>
                  <p className="mt-2 text-[15px] font-black text-slate-900">
                    от {formatPrice(calcMonthly(price))} /мес × 24
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Без переплат (демо)
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Кешбек
                  </p>
                  <p className="mt-2 text-[15px] font-black text-slate-900">
                    {formatPrice(Math.round(price * 0.15))}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    итог: {formatPrice(Math.round(price * 0.85))}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-10">
                <h2 className="text-xl font-black text-slate-900">Описание</h2>
                <p className="mt-4 whitespace-pre-line text-[15px] font-semibold leading-relaxed text-slate-600">
                  {product.description
                    ? clampText(product.description, 650)
                    : "Описание пока не добавлено."}
                </p>
              </div>
            </section>

            {/* RIGHT: Buy panel */}
            <aside className="rounded-[32px] bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                    Цена
                  </p>
                  <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">
                    {formatPrice(price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                    Вариант
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {memory ? `${memory} ГБ` : "—"} · {color || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-sky-50 px-5 py-4 text-[14px] font-black text-sky-700">
                {formatPrice(Math.round(price * 0.85))}{" "}
                <span className="text-slate-400">с учетом кешбэка</span>
              </div>

              {/* Memory selector */}
              {memoryOptions.length > 1 ? (
                <div className="mt-8">
                  <p className="text-sm font-black text-slate-900">Память</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {memoryOptions.map((mem) => {
                      const active = activeMem === mem;
                      return (
                        <button
                          key={mem}
                          type="button"
                          onClick={() => setMemory(mem)}
                          className={[
                            "rounded-full px-4 py-2 text-sm font-black transition",
                            active
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-900 hover:bg-slate-200",
                          ].join(" ")}
                        >
                          {mem} ГБ
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Color/variant selector */}
              {colorOptionsForActiveMem.length > 0 ? (
                <div className="mt-8">
                  <p className="text-sm font-black text-slate-900">Цвет</p>
                  <div className="mt-3 space-y-2">
                    {colorOptionsForActiveMem.map((v) => {
                      const active = v.variant_id === selectedId;
                      return (
                        <button
                          key={v.variant_id}
                          type="button"
                          onClick={() => setColorVariant(v.variant_id)}
                          className={[
                            "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900">
                                {v.color || "—"}
                              </span>
                              {active ? (
                                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white">
                                  выбран
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              {typeof v.memory_gb === "number" ? `${v.memory_gb} ГБ` : "—"} ·{" "}
                              {formatPrice(v.price_kzt)}
                            </div>
                          </div>

                          <span className="text-sm font-black text-slate-900">
                            {formatPrice(v.price_kzt)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-8 grid gap-3">
                <button
                  onClick={addToCart}
                  disabled={!selected || adding}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[15px] font-black text-white transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
                  {adding ? "Добавляем..." : "Купить"}
                </button>

                <Link
                  href="/checkout"
                  className={[
                    "flex h-14 w-full items-center justify-center rounded-2xl text-[15px] font-black transition",
                    selected ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "bg-slate-100 text-slate-400 pointer-events-none",
                  ].join(" ")}
                >
                  Купить сейчас
                </Link>
              </div>

              {/* Trust blocks */}
              <div className="mt-10 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900">Официальная гарантия</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">14 дней на возврат (демо)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
                  <Truck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900">Доставка</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">По Астане — быстро (демо)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
                  <Store className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900">Самовывоз</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Наличие уточняется при оформлении</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}