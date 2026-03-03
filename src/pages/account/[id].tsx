import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";

type OrderItem = {
  id: string;
  title_snapshot: string;
  quantity: number;
  price_kzt: number;
};

type OrderDetail = {
  id: string;
  created_at: string;
  status: string;
  total_amount_kzt: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  branches?: { name: string; address: string } | null;
  items: OrderItem[];
};

function normalizeOrder(json: any): OrderDetail | null {
  if (!json || typeof json !== "object") return null;
  if (!json.id || !json.created_at) return null;

  const itemsArr = Array.isArray(json.items) ? json.items : [];
  const items: OrderItem[] = itemsArr.map((it: any) => ({
    id: String(it.id ?? ""),
    title_snapshot: String(it.title_snapshot ?? ""),
    quantity: Number(it.quantity ?? 0),
    price_kzt: Number(it.price_kzt ?? 0),
  }));

  return {
    id: String(json.id),
    created_at: String(json.created_at),
    status: String(json.status ?? ""),
    total_amount_kzt: Number(json.total_amount_kzt ?? 0),
    customer_name: json.customer_name ?? null,
    customer_phone: json.customer_phone ?? null,
    customer_email: json.customer_email ?? null,
    branches: json.branches ?? null,
    items,
  };
}

export default function OrderDetailPage() {
  const router = useRouter();
  const id = router.query.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const orderId = String(id || "");
    if (!orderId) return;

    (async () => {
      setLoading(true);
      setErr(null);
      setOrder(null);

      const res = await authedFetch(`/api/orders/${orderId}`);
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace(`/auth?next=/account/${orderId}`);
        return;
      }

      if (!res.ok) {
        setErr(json?.error || "Не удалось загрузить заказ.");
        setLoading(false);
        return;
      }

      const normalized = normalizeOrder(json);
      if (!normalized) {
        setErr("Некорректные данные заказа.");
        setLoading(false);
        return;
      }

      setOrder(normalized);
      setLoading(false);
    })();
  }, [router.isReady, id, router]);

  const total = useMemo(() => {
    if (!order) return 0;
    // total_amount_kzt в orders уже есть, но на всякий — пересчёт
    const computed = order.items.reduce((s, it) => s + it.quantity * it.price_kzt, 0);
    return order.total_amount_kzt || computed;
  }, [order]);

  if (loading) {
    return <main className="container-shell py-10">Загрузка...</main>;
  }

  if (err) {
    return (
      <main className="container-shell py-10">
        <div className="card-surface p-6">
          <p className="text-sm text-gray-600">{err}</p>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => router.reload()}
            >
              Обновить
            </button>
            <Link href="/account" className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              Назад к заказам
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container-shell py-10">
        <div className="card-surface p-6">Заказ не найден.</div>
      </main>
    );
  }

  return (
    <main className="container-shell py-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold">Заказ #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString("ru-RU")}</p>
        </div>
        <Link href="/account" className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
          Все заказы
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="card-surface p-5">
          <h2 className="mb-3 text-lg font-medium">Состав заказа</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title_snapshot}</p>
                  <p className="text-sm text-gray-600">Количество: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(item.price_kzt)}</p>
                  <p className="text-xs text-gray-500">за шт.</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card-surface p-5">
            <p className="text-sm text-gray-500">Статус</p>
            <p className="mt-1 font-medium">{order.status || "created"}</p>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">Итого</p>
              <p className="mt-1 text-2xl font-semibold">{formatPrice(total)}</p>
            </div>
          </div>

          <div className="card-surface p-5">
            <p className="text-sm font-medium">Самовывоз</p>
            <p className="mt-2 text-sm text-gray-700">{order.branches?.name || "Филиал"}</p>
            <p className="text-sm text-gray-600">{order.branches?.address || ""}</p>
          </div>

          <div className="card-surface p-5">
            <p className="text-sm font-medium">Контакты</p>
            <p className="mt-2 text-sm text-gray-700">{order.customer_email || "—"}</p>
            <p className="text-sm text-gray-600">{order.customer_name || "—"}</p>
            <p className="text-sm text-gray-600">{order.customer_phone || "—"}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}