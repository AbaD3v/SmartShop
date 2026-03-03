// src/pages/account/index.tsx
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { authedFetch } from "@/lib/authedFetch";
import {
  ArrowRight,
  Package,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  total_amount_kzt: number | null; // ✅
  branch_id: string | null;
  branches?: { name?: string; address?: string } | null;
};

type ToastKind = "info" | "error";

export default function AccountPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setToast(null);

    const res = await authedFetch("/api/orders"); // ✅ ВАЖНО: именно /api/orders

    if (res.status === 401) {
      setOrders([]);
      setToast({ kind: "info", text: "Войди в аккаунт, чтобы увидеть заказы." });
      setLoading(false);
      return;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setOrders([]);
      setToast({ kind: "error", text: json?.error || "Не удалось загрузить заказы." });
      setLoading(false);
      return;
    }

    // ✅ гарантируем массив
    setOrders(Array.isArray(json) ? (json as OrderRow[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSpent = useMemo(() => {
    return (orders ?? []).reduce((sum, o) => sum + (o.total_amount_kzt ?? 0), 0);
  }, [orders]);

  const count = orders.length;

  const statusLabel = (s: string | null) => {
    if (!s) return "—";
    const v = s.toLowerCase();
    if (v === "pending") return "В обработке";
    if (v === "paid") return "Оплачен";
    if (v === "ready") return "Готов к выдаче";
    if (v === "completed") return "Выдан";
    if (v === "canceled" || v === "cancelled") return "Отменён";
    return s;
  };

  return (
    <main className="container-shell py-10 md:py-14">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Аккаунт</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Мои заказы
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            История покупок, суммы и статусы — всё в одном месте.
          </p>
        </div>

        <Link
          href="/catalog"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
        >
          <Package size={16} className="text-gray-700" />
          Перейти в каталог
          <ArrowRight size={16} className="text-gray-500" />
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-3 md:mb-8 md:grid-cols-3">
        <div className="card-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">Заказов</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{count}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <Receipt size={18} className="text-gray-800" />
            </div>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">Сумма покупок</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                {formatPrice(totalSpent)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <ShieldCheck size={18} className="text-gray-800" />
            </div>
          </div>
        </div>

        <div className="card-surface p-5">
          <p className="text-xs text-gray-500">Подсказка</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            Нажми на заказ, чтобы открыть детали и состав.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          className={[
            "mb-6 flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.03)]",
            toast.kind === "error" ? "border-rose-200" : "border-gray-200",
          ].join(" ")}
          role="status"
        >
          <span className="mt-0.5">
            {toast.kind === "error" ? (
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

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-surface p-5">
              <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-6 w-44 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 flex gap-2">
                <div className="h-7 w-28 animate-pulse rounded-full bg-gray-100" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card-surface p-8 md:p-10">
          <p className="text-gray-900">Пока нет заказов.</p>
          <p className="mt-1 text-sm text-gray-600">
            Начни с каталога — добавь смартфон в корзину и оформи самовывоз.
          </p>

          <Link
            href="/catalog"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
          >
            Выбрать смартфон
            <ArrowRight size={16} className="text-gray-500" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const created = new Date(order.created_at);
            const branchName = order.branches?.name ?? null;

            return (
              <Link
                href={`/account/${order.id}`}
                key={order.id}
                className="group card-surface block p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">#{order.id.slice(0, 8)}</span>{" "}
                      <span className="mx-1">·</span>
                      {created.toLocaleString("ru-RU")}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                      {formatPrice(order.total_amount_kzt || 0)}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition group-hover:bg-gray-50 md:inline-flex">
                    Детали
                    <ArrowRight size={16} className="text-gray-500" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                  {branchName ? (
                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1">
                      {branchName}
                    </span>
                  ) : null}

                  {order.status ? (
                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1">
                      {statusLabel(order.status)}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}