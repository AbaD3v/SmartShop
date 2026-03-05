// src/pages/branches.tsx
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ArrowRight,
  Info,
  X,
  Loader2,
  ExternalLink
} from "lucide-react";
import type { Branch } from "@/lib/types";

// Расширяем тип для безопасности
interface ExtendedBranch extends Branch {
  phone?: string;
  work_hours?: string;
  lat?: number | string;
  lng?: number | string;
}

const MapView = dynamic(() => import("@/components/branches/MapView"), {
  ssr: false,
}) as React.ComponentType<{
  branches: ExtendedBranch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}>;

type Toast = { kind: "info" | "error"; text: string } | null;

export default function BranchesPage() {
  const [branches, setBranches] = useState<ExtendedBranch[]>([]);
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
        const list = Array.isArray(data) ? (data as ExtendedBranch[]) : [];

        if (cancelled) return;

        setBranches(list);
        if (list.length > 0) setSelectedId(list[0].id);
        if (!list.length) setToast({ kind: "info", text: "Пока нет доступных филиалов." });
      } catch {
        if (!cancelled) setToast({ kind: "error", text: "Не удалось загрузить данные. Обновите страницу." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(
    () => branches.find((b) => b.id === selectedId) ?? null,
    [branches, selectedId]
  );

  const getCoords = (branch: ExtendedBranch) => {
    const lat = Number(branch.latitude || branch.lat);
    const lng = Number(branch.longitude || branch.lng);
    return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng } : null;
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <span className="inline-block rounded-full bg-[#22C55E]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#22C55E]">
            Наши локации
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Филиалы в Астане
          </h1>
          <p className="mt-3 max-w-xl text-gray-500 font-medium">
            Выберите удобный для вас пункт выдачи или сервисный центр на карте города.
          </p>
        </motion.div>

        <a
          href="https://www.google.com/maps/search/Freedom+Mobile+Астана"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-gray-800 hover:shadow-xl active:scale-95"
        >
          <MapPin size={18} className="text-[#22C55E]" />
          Показать все на Картах
          <ExternalLink size={16} className="opacity-50 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className={`mb-8 flex items-center gap-4 rounded-3xl border p-5 ${
              toast.kind === "error" ? "border-rose-100 bg-rose-50/50" : "border-blue-100 bg-blue-50/50"
            }`}
          >
            <Info className={toast.kind === "error" ? "text-rose-500" : "text-blue-500"} size={22} />
            <div className="flex-1 font-bold text-gray-800">{toast.text}</div>
            <button onClick={() => setToast(null)} className="rounded-full p-2 hover:bg-white/50"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Карта */}
        <section className="relative h-[500px] overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 lg:h-[calc(100vh-320px)]">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="animate-spin text-[#22C55E]" />
              <p className="font-bold text-gray-400">Загружаем карту...</p>
            </div>
          ) : (
            <div className="h-full w-full p-3">
              <div className="h-full w-full overflow-hidden rounded-[32px]">
                <MapView branches={branches} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
            </div>
          )}
        </section>

        {/* Список филиалов */}
        <aside className="hide-scrollbar space-y-4 lg:h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-[32px] bg-gray-100" />
            ))
          ) : (
            branches.map((branch) => {
              const isActive = branch.id === selectedId;
              const coords = getCoords(branch);

              return (
                <motion.div
                  key={branch.id}
                  layout
                  onClick={() => setSelectedId(branch.id)}
                  className={`cursor-pointer rounded-[32px] border-2 p-6 transition-all ${
                    isActive 
                    ? "border-gray-900 bg-white shadow-2xl" 
                    : "border-transparent bg-white hover:border-gray-200 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`rounded-2xl p-3 ${isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <MapPin size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-900">{branch.name}</h3>
                      <p className="mt-1 text-sm font-medium text-gray-500 leading-relaxed">{branch.address}</p>
                    </div>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-50 pt-6">
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                        <Phone size={16} className="text-[#22C55E]" />
                        {branch.phone}
                      </div>
                    )}
                    {branch.work_hours && (
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                        <Clock size={16} className="text-[#22C55E]" />
                        {branch.work_hours}
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6">
                      <a
                        href={coords ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22C55E] py-4 text-sm font-black text-white shadow-lg shadow-[#22C55E]/30 hover:bg-[#1da850]"
                      >
                        <Navigation size={18} />
                        Построить маршрут
                        <ArrowRight size={18} />
                      </a>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </aside>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}