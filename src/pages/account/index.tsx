// src/pages/account/orders/index.tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import {
  Search,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Receipt,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  total_amount_kzt: number | null;
  branch_id: string | null;
  branches?: { name?: string | null; address?: string | null } | null;
};

type OrderPreviewMap = Record<string, string | null>;

const SectionShell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={[
      "rounded-[32px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function statusBadge(statusRaw: string | null | undefined) {
  const s = String(statusRaw ?? "pending").toLowerCase();
  if (["paid", "completed", "done", "success"].includes(s)) {
    return { label: "Готов", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/50", icon: CheckCircle2 };
  }
  if (["cancelled", "canceled", "failed", "rejected"].includes(s)) {
    return { label: "Отменён", cls: "bg-rose-50 text-rose-700 ring-rose-200/50", icon: AlertTriangle };
  }
  return { label: "В работе", cls: "bg-sky-50 text-sky-700 ring-sky-200/50", icon: Clock };
}

export default function OrdersPage() {
  const router = useRouter();
  const [items, setItems] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "processing" | "done" | "cancelled">("all");
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [previews, setPreviews] = useState<OrderPreviewMap>({});

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await authedFetch("/api/orders");
      const json = await r.json().catch(() => []);
      setItems(Array.isArray(json) ? (json as OrderRow[]) : []);
    } catch {
      showToast("error", "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current); };
  }, []);

  useEffect(() => {
    const need = items.slice(0, 10).filter(o => previews[o.id] === undefined);
    if (!need.length) return;
    need.forEach(async (o) => {
      try {
        const r = await authedFetch(`/api/orders/${encodeURIComponent(o.id)}`);
        const data = await r.json();
        setPreviews(p => ({ ...p, [o.id]: data?.items?.[0]?.image_url ?? null }));
      } catch {
        setPreviews(p => ({ ...p, [o.id]: null }));
      }
    });
  }, [items, previews]);

  const view = useMemo(() => {
    let arr = [...items];
    if (status !== "all") {
      arr = arr.filter(o => String(o.status).toLowerCase().includes(status));
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      arr = arr.filter(o => String(o.id).toLowerCase().includes(qq) || String(o.branches?.name).toLowerCase().includes(qq));
    }
    return arr;
  }, [items, q, status]);

  return (
    <div className="min-h-screen bg-[#f4f6f7] pb-20 text-slate-900">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-2xl"
          >
            <span className="text-sm font-black">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1400px] px-6 pt-10">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-gray-900">Мои заказы</h1>
            <p className="mt-2 font-bold text-gray-400">{view.length} заказов в истории</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск..."
                className="h-12 w-full md:w-[300px] rounded-2xl border-none bg-white pl-11 pr-4 text-[14px] font-semibold shadow-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              onClick={() => router.push("/catalog")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-[14px] font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            >
              <ShoppingBag size={18} />
              В каталог
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 font-bold text-gray-400">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            Загрузка...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {view.map((o) => {
              const b = statusBadge(o.status);
              const StatusIcon = b.icon;
              const img = previews[o.id];

              return (
                <motion.div key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SectionShell className="p-6 transition-all border border-transparent hover:border-emerald-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black ring-1 ${b.cls}`}>
                            <StatusIcon size={14} />
                            {b.label}
                          </span>
                          <span className="text-[12px] font-black text-gray-400">
                            #{String(o.id).slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-4 flex items-start gap-2 text-[14px] font-black text-gray-900">
                          <MapPin size={18} className="text-emerald-600 shrink-0" />
                          <div className="truncate">{o.branches?.name ?? "Филиал не указан"}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[24px] font-black text-gray-900">
                          {formatPrice(Number(o.total_amount_kzt))}
                        </div>
                        <div className="text-[12px] font-bold text-gray-400">{fmtDate(o.created_at)}</div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-5">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-gray-50 ring-1 ring-black/5">
                        {img === undefined ? (
                          <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-100">
                            <Loader2 size={16} className="animate-spin text-gray-300" />
                          </div>
                        ) : img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-200">
                            <ImageIcon size={28} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/account/orders/${o.id}`)}
                          className="inline-flex h-[48px] items-center justify-center rounded-[16px] bg-[#0B1220] px-8 text-[14px] font-black text-white transition hover:bg-[#111827] active:scale-95 shadow-sm"
                        >
                          Детали заказа
                        </button>

                        <button
                          type="button"
                          onClick={() => showToast("info", "Квитанция формируется...")}
                          className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[16px] bg-white px-6 text-[14px] font-black text-slate-700 ring-1 ring-black/5 transition hover:bg-slate-50 active:scale-95 shadow-sm"
                        >
                          Квитанция
                          <Receipt size={18} className="text-emerald-500" />
                        </button>
                      </div>
                    </div>
                  </SectionShell>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}