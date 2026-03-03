// src/pages/product/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShoppingBag,
  X,
} from "lucide-react";
import { authedFetch } from "@/lib/authedFetch";

function normalizeList(json: any): CatalogVariant[] {
  const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  return arr as CatalogVariant[];
}

type ToastKind = "success" | "error" | "info";

export default function ProductPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const toastTimerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  const load = async (productId: string) => {
    setLoading(true);
    setToast(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Лучше, чем тянуть весь каталог: поддержка productId в API
      const res = await fetch(`/api/catalog/products?productId=${encodeURIComponent(productId)}`, {
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));
      const list = normalizeList(json);

      // fallback если API пока не умеет productId
      const filtered = list.filter((x) => String(x.product_id) === String(productId));

      setVariants(filtered);
      setSelectedId(filtered[0]?.variant_id ?? null);
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
    [variants, selectedId]
  );

  const memoryOptions = useMemo(() => {
    const values = Array.from(
      new Set(variants.map((v) => v.memory_gb).filter((x) => typeof x === "number"))
    ) as number[];
    values.sort((a, b) => a - b);
    return values;
  }, [variants]);

  const addToCart = async () => {
    if (!selected) return;

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

  const imgSrc =
    selected?.image_url ||
    product?.image_url ||
    "https://placehold.co/800x560?text=Smartphone";

  if (loading) {
    return (
      <main className="container-shell py-10 md:py-14">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-surface h-[460px] animate-pulse bg-gray-100" />
          <div className="card-surface p-6">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-9 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-gray-100" />
            <div className="mt-3 h-12 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container-shell py-10 md:py-14">
        <div className="card-surface p-8 md:p-10">
          <p className="text-lg font-medium text-gray-900">Товар не найден</p>
          <p className="mt-1 text-sm text-gray-600">Возможно, ссылка устарела.</p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
          >
            <ArrowLeft size={16} className="text-gray-600" />
            Вернуться в каталог
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container-shell py-10 md:py-14">
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
        >
          <ArrowLeft size={16} className="text-gray-600" />
          Назад
        </Link>

        <Link
          href="/cart"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
        >
          <ShoppingBag size={16} className="text-gray-700" />
          Корзина
          <ArrowRight size={16} className="text-gray-500" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image */}
        <div className="card-surface overflow-hidden p-2">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-gray-50">
            <img
              src={imgSrc}
              alt={product.title}
              className="h-[380px] w-full object-cover md:h-[520px]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent" />
          </div>

          {/* Quick specs */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <p className="text-xs text-gray-500">Память</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {selected?.memory_gb ?? product.memory_gb} ГБ
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <p className="text-xs text-gray-500">Цвет</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{selected?.color ?? product.color}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <section className="card-surface p-6 md:p-7">
          <p className="text-sm text-gray-500">{product.brand}</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            {product.title}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
            {product.description ||
              "Флагманский смартфон с премиальными материалами и высокой производительностью."}
          </p>

          {/* Price */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">Цена</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                  {formatPrice((selected?.price_kzt ?? product.price_kzt) as number)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">Вариант</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {(selected?.memory_gb ?? product.memory_gb) as number} ГБ ·{" "}
                  {(selected?.color ?? product.color) as string}
                </p>
              </div>
            </div>
          </div>

          {/* Memory chips (optional) */}
          {memoryOptions.length > 1 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-900">Память</p>
              <div className="flex flex-wrap gap-2">
                {memoryOptions.map((mem) => {
                  const isActive = (selected?.memory_gb ?? product.memory_gb) === mem;
                  return (
                    <span
                      key={mem}
                      className={[
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-gray-900",
                      ].join(" ")}
                    >
                      {mem} ГБ
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Точный выбор делается ниже в списке вариантов.
              </p>
            </div>
          ) : null}

          {/* Variants */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">Выберите вариант</p>
              <p className="text-xs text-gray-500">{variants.length} шт.</p>
            </div>

            <div className="space-y-2">
              {variants.map((v) => {
                const active = v.variant_id === selectedId;

                return (
                  <button
                    key={v.variant_id}
                    type="button"
                    onClick={() => setSelectedId(v.variant_id)}
                    className={[
                      "group flex w-full items-center justify-between gap-4 rounded-2xl border p-3 text-left transition",
                      active
                        ? "border-slate-900 bg-slate-900/[0.03]"
                        : "border-gray-200 bg-white hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {v.memory_gb} ГБ · {v.color}
                        </span>
                        {active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-white">
                            <Check size={12} /> выбран
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        SKU: {v.sku ?? "—"}
                      </span>
                    </span>

                    <span className="shrink-0 text-sm font-semibold text-gray-900">
                      {formatPrice(v.price_kzt)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toast */}
          {toast ? (
            <div
              className={[
                "mt-4 flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.03)]",
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
                  <Info size={18} className="text-gray-700" />
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

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:flex-1"
              onClick={addToCart}
              loading={adding}
              leftIcon={<ShoppingBag size={16} />}
              disabled={!selected}
            >
              В корзину
            </Button>

            <Link href="/checkout" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full" disabled={!selected}>
                Купить сейчас
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Самовывоз в Астане. Наличие уточняется на этапе оформления.
          </p>
        </section>
      </div>
    </main>
  );
}