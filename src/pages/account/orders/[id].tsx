// src/pages/account/orders/[id].tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import { Header } from "@/components/layout/Header";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string | null;
  title_snapshot: string;
  quantity: number;
  price_kzt: number;
};

type OrderDetail = {
  id: string;
  created_at: string;
  status: string | null;
  total_amount_kzt: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  branches?: { name?: string | null; address?: string | null } | null;
  items: OrderItem[];
};

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

function statusChip(statusRaw: string | null | undefined) {
  const s = String(statusRaw ?? "pending").toLowerCase();

  if (["paid", "completed", "done", "success"].includes(s)) {
    return { label: "Готов", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/60", Icon: CheckCircle2 };
  }
  if (["cancelled", "canceled", "failed", "rejected"].includes(s)) {
    return { label: "Отменён", cls: "bg-rose-50 text-rose-700 ring-rose-200/60", Icon: AlertTriangle };
  }
  if (["processing", "in_progress", "packing"].includes(s)) {
    return { label: "В работе", cls: "bg-sky-50 text-sky-700 ring-sky-200/60", Icon: Clock };
  }
  return { label: "Ожидает", cls: "bg-amber-50 text-amber-700 ring-amber-200/60", Icon: Clock };
}

export default function OrderDetailPage() {
  const router = useRouter();
  const id = String(router.query.id ?? "");
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    if (!router.isReady || !id) return;

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await authedFetch(`/api/orders/${encodeURIComponent(id)}`);
        if (r.status === 401) {
          showToast("info", "Нужно войти в аккаунт");
          setData(null);
          setLoading(false);
          return;
        }
        if (!r.ok) {
          setData(null);
          setLoading(false);
          return;
        }
        const json = (await r.json()) as OrderDetail;
        if (!alive) return;
        setData(json);
      } catch {
        setData(null);
        showToast("error", "Не удалось загрузить заказ");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [router.isReady, id]);

  const total = useMemo(() => Number(data?.total_amount_kzt ?? 0), [data]);
  const chip = statusChip(data?.status);
  const StatusIcon = chip.Icon;

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
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[14px] font-black text-gray-700 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <ArrowLeft size={18} />
            Назад
          </Link>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-[14px] font-black text-white transition hover:bg-gray-800"
          >
            <ShoppingBag size={18} />
            В каталог
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-7 lg:grid-cols-2">
            <div className="h-[320px] animate-pulse rounded-[36px] bg-gray-100" />
            <div className="h-[320px] animate-pulse rounded-[36px] bg-gray-100" />
          </div>
        ) : !data ? (
          <div className="rounded-[36px] bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <div className="text-2xl font-black">Заказ не найден</div>
            <p className="mt-2 text-[15px] font-semibold text-gray-500">
              Возможно, у вас нет доступа или он был удалён.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1fr_460px]">
            {/* Left: items */}
            <section className="rounded-[36px] bg-white p-8 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Заказ
                  </div>
                  <div className="mt-2 text-3xl font-black text-gray-900">
                    #{String(data.id).slice(0, 8).toUpperCase()}
                  </div>
                  <div className="mt-3 text-[13px] font-bold text-gray-500">
                    {fmtDateTime(data.created_at)}
                  </div>
                </div>

                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-black ring-1 ${chip.cls}`}>
                  <StatusIcon size={16} />
                  {chip.label}
                </span>
              </div>

              <div className="mt-8 space-y-4">
                {data.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between rounded-3xl bg-gray-50 px-5 py-4 ring-1 ring-black/5"
                  >
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-[15px] font-black text-gray-900">
                        {it.title_snapshot}
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-gray-500">
                        {it.quantity} × {formatPrice(it.price_kzt)}
                      </div>
                    </div>
                    <div className="text-[15px] font-black text-gray-900 tabular-nums">
                      {formatPrice(it.quantity * it.price_kzt)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Right: summary */}
            <aside className="sticky top-24 h-fit rounded-[36px] bg-white p-8 shadow-sm ring-1 ring-black/5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                Резюме
              </div>

              <div className="mt-4 text-4xl font-black text-gray-900 tabular-nums">
                {formatPrice(total)}
              </div>

              <div className="mt-2 text-[13px] font-bold text-gray-500">
                {formatPrice(Math.round(total / 24))} /мес × 24
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-start gap-3 rounded-3xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
                  <MapPin size={18} className="mt-0.5 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="text-[14px] font-black text-gray-900">
                      {String(data.branches?.name ?? "Филиал")}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[13px] font-semibold text-gray-500">
                      {String(data.branches?.address ?? "")}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-3xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-gray-400">
                      <User size={16} /> Клиент
                    </div>
                    <div className="mt-2 text-[14px] font-black text-gray-900">
                      {data.customer_name || "—"}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-gray-400">
                      <Phone size={16} /> Телефон
                    </div>
                    <div className="mt-2 text-[14px] font-black text-gray-900">
                      {data.customer_phone || "—"}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-gray-50 px-5 py-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-gray-400">
                      <Mail size={16} /> Email
                    </div>
                    <div className="mt-2 break-all text-[14px] font-black text-gray-900">
                      {data.customer_email || "—"}
                    </div>
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