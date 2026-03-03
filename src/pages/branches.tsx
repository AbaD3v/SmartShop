// src/pages/branches.tsx
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ArrowRight,
  Info,
  X,
  Loader2,
} from "lucide-react";
import type { Branch } from "@/lib/types";

// react-leaflet нельзя рендерить на сервере — делаем dynamic import
const MapView = dynamic(() => import("@/components/branches/MapView"), {
  ssr: false,
}) as React.ComponentType<{
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}>;

type Toast = { kind: "info" | "error"; text: string } | null;

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/branches");
        const data = await r.json().catch(() => ({}));
        const list = Array.isArray(data) ? (data as Branch[]) : [];

        if (cancelled) return;

        setBranches(list);
        setSelectedId(list[0]?.id ?? null);

        if (!list.length) setToast({ kind: "info", text: "Пока нет доступных филиалов." });
      } catch {
        if (!cancelled) setToast({ kind: "error", text: "Не удалось загрузить филиалы. Обнови страницу." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => branches.find((b) => b.id === selectedId) ?? null,
    [branches, selectedId]
  );

  const coordsFor = (branch: any) => {
    const lat =
      typeof branch?.latitude === "number"
        ? branch.latitude
        : typeof branch?.lat === "number"
          ? branch.lat
          : typeof branch?.latitude === "string"
            ? Number(branch.latitude)
            : typeof branch?.lat === "string"
              ? Number(branch.lat)
              : null;

    const lng =
      typeof branch?.longitude === "number"
        ? branch.longitude
        : typeof branch?.lng === "number"
          ? branch.lng
          : typeof branch?.longitude === "string"
            ? Number(branch.longitude)
            : typeof branch?.lng === "string"
              ? Number(branch.lng)
              : null;

    const ok = Number.isFinite(lat) && Number.isFinite(lng);
    return ok ? { lat: Number(lat), lng: Number(lng) } : null;
  };

  return (
    <main className="container-shell py-10 md:py-14">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Филиалы</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Филиалы в Астане
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            На компьютере список прокручивается отдельно — страница не “уезжает” вниз.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
          >
            <MapPin size={16} className="text-gray-700" />
            Открыть Maps
            <ArrowRight size={16} className="text-gray-500" />
          </a>
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
            <Info size={18} className={toast.kind === "error" ? "text-rose-600" : "text-gray-700"} />
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

      {/* Layout:
          - Mobile: обычная прокрутка страницы
          - Desktop (lg+): фиксируем рабочую область по высоте, прокрутка только списка
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch lg:overflow-hidden lg:rounded-[28px]">
        {/* Map Card */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={[
            "relative overflow-hidden rounded-[28px] border border-gray-200/70 bg-white",
            "shadow-[0_1px_0_rgba(0,0,0,0.03)]",
            // фиксируем высоту на desktop, чтобы фон не растягивался и не появлялась пустота
            "h-[520px] md:h-[560px] lg:h-[calc(100vh-260px)]",
          ].join(" ")}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-white/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-white/85 to-transparent" />

          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 size={18} className="animate-spin" />
              Загрузка карты…
            </div>
          ) : branches.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Нет филиалов для отображения.
            </div>
          ) : (
            <div className="h-full w-full p-2">
              <div className="h-full w-full overflow-hidden rounded-2xl border border-gray-200/70">
                <MapView
                  branches={branches}
                  selectedId={selectedId}
                  onSelect={(id: string) => setSelectedId(id)}
                />
              </div>
            </div>
          )}
        </motion.section>

        {/* List: scroll inside on desktop */}
        <aside
          className={[
            "space-y-3",
            // делаем отдельную прокрутку списка на desktop
            "lg:h-[calc(100vh-260px)] lg:overflow-auto lg:pr-1",
          ].join(" ")}
        >
          {loading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[22px] border border-gray-200/70 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                  <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-9 w-40 animate-pulse rounded-xl bg-gray-100" />
                </div>
              ))}
            </>
          ) : (
            branches.map((branch) => {
              const isActive = branch.id === selectedId;
              const coords = coordsFor(branch);

              return (
                <motion.button
                  key={branch.id}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedId(branch.id)}
                  className={[
                    "group w-full text-left transition-transform",
                    "rounded-[22px] border bg-white p-4",
                    "shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                    isActive
                      ? "border-slate-900"
                      : "border-gray-200/70 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border bg-white",
                        "shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                        isActive ? "border-slate-200" : "border-gray-200",
                      ].join(" ")}
                    >
                      <MapPin size={18} className={isActive ? "text-slate-900" : "text-gray-500"} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-tight text-gray-900">
                            {branch.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{branch.address}</p>
                        </div>

                        {isActive ? (
                          <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
                            выбран
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5 text-xs text-gray-500">
                        {(branch as any).phone ? (
                          <span className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-500" />
                            {(branch as any).phone}
                          </span>
                        ) : null}

                        {(branch as any).work_hours ? (
                          <span className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            {(branch as any).work_hours}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <a
                          className={[
                            "inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium text-gray-900 transition",
                            coords ? "border-gray-200 hover:bg-gray-50" : "border-gray-200 opacity-60",
                          ].join(" ")}
                          href={
                            coords
                              ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  `${coords.lat},${coords.lng}`
                                )}`
                              : undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-disabled={!coords}
                        >
                          <Navigation size={14} className="text-gray-700" />
                          Маршрут
                          <ArrowRight size={14} className="text-gray-500" />
                        </a>

                        {!coords ? (
                          <p className="mt-2 text-[11px] text-gray-400">Координаты не указаны.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </aside>
      </div>

      {/* Footer hint */}
      {selected ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          Выбран филиал: <span className="font-medium text-gray-900">{selected.name}</span>
        </div>
      ) : null}
    </main>
  );
}