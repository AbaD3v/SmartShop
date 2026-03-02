import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CatalogVariant } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Check, ShoppingBag } from "lucide-react";

function normalizeList(json: any): CatalogVariant[] {
  const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  return arr as CatalogVariant[];
}

export default function ProductPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async (productId: string) => {
    setLoading(true);
    setMsg(null);
    try {
      // Лучше, чем тянуть весь каталог:
      // сделай в API поддержку productId и верни только варианты этого товара
      const res = await fetch(`/api/catalog/products?productId=${encodeURIComponent(productId)}`);
      const json = await res.json();
      const list = normalizeList(json);

      // fallback если API пока не умеет productId:
      const filtered = list.filter((x) => String(x.product_id) === String(productId));

      setVariants(filtered);
      setSelectedId(filtered[0]?.variant_id ?? null);
    } catch {
      setVariants([]);
      setSelectedId(null);
      setMsg("Не удалось загрузить товар. Обнови страницу.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const product = variants[0];

  const selected = useMemo(
    () => variants.find((v) => v.variant_id === selectedId) ?? null,
    [variants, selectedId]
  );

  const addToCart = async () => {
    if (!selected) return;
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.variant_id, quantity: 1 }),
      });

      if (res.ok) setMsg("Добавлено в корзину ✅");
      else if (res.status === 401) setMsg("Нужно войти в аккаунт, чтобы добавить в корзину.");
      else setMsg("Не удалось добавить в корзину.");
    } catch {
      setMsg("Сеть недоступна. Попробуй ещё раз.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="container-shell py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-surface h-[420px] animate-pulse bg-gray-100" />
          <div className="card-surface p-6">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container-shell py-10">
        <div className="card-surface p-8">
          <p className="text-lg font-medium">Товар не найден</p>
          <p className="mt-1 text-sm text-gray-600">Возможно, ссылка устарела.</p>
          <Link href="/catalog" className="mt-5 inline-block rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            Вернуться в каталог
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container-shell py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/catalog" className="text-sm text-gray-600 hover:text-gray-900">
          ← Назад в каталог
        </Link>
        <Link href="/cart" className="text-sm text-gray-600 hover:text-gray-900">
          Корзина →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image */}
        <div className="card-surface overflow-hidden p-2">
          <img
            src={selected?.image_url || product.image_url || "https://placehold.co/800x560?text=Smartphone"}
            alt={product.title}
            className="h-full w-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <section className="card-surface p-6">
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{product.title}</h1>
          <p className="mt-3 text-gray-600">
            {product.description ||
              "Флагманский смартфон с премиальными материалами и высокой производительностью."}
          </p>

          {/* Price */}
          <div className="mt-6">
            <p className="text-xs text-gray-500">Цена</p>
            <p className="text-2xl font-semibold">
              {selected ? formatPrice(selected.price_kzt) : formatPrice(product.price_kzt)}
            </p>
          </div>

          {/* Variants */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-900">Выберите вариант</p>
            <div className="space-y-2">
              {variants.map((v) => {
                const active = v.variant_id === selectedId;
                return (
                  <button
                    key={v.variant_id}
                    type="button"
                    onClick={() => setSelectedId(v.variant_id)}
                    className={[
                      "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition",
                      active
                        ? "border-slate-900 bg-slate-900/[0.03]"
                        : "border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">
                        {v.memory_gb} ГБ · {v.color}
                      </span>
                      {active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-white">
                          <Check size={12} /> выбран
                        </span>
                      ) : null}
                    </span>
                    <strong className="text-sm">{formatPrice(v.price_kzt)}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
              {msg}
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
            >
              В корзину
            </Button>

            <Link href="/checkout" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
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