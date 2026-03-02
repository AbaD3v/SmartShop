import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import type { Branch } from "@/lib/types";

// react-leaflet нельзя рендерить на сервере — делаем dynamic import
const MapView = dynamic(
  () => import("@/components/branches/MapView"),
  { ssr: false }
) as React.ComponentType<{
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}>;

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBranches(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => branches.find((b) => b.id === selectedId) ?? null,
    [branches, selectedId]
  );

  return (
    <main className="container-shell py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold md:text-4xl">Филиалы в Астане</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Выберите филиал для самовывоза — карта интерактивная, можно приближать и двигать.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="card-surface overflow-hidden"
        >
          {loading ? (
            <div className="flex h-[460px] items-center justify-center text-sm text-gray-500">
              Загрузка карты…
            </div>
          ) : (
            <MapView
              branches={branches}
              selectedId={selectedId}
              onSelect={(id: string) => setSelectedId(id)}
            />
          )}
        </motion.div>

        <aside className="space-y-3">
          {branches.map((branch) => {
            const isActive = branch.id === selectedId;
            return (
              <motion.button
                key={branch.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedId(branch.id)}
                className={`card-surface w-full p-4 text-left transition-all ${
                  isActive
                    ? "border border-slate-900 shadow-md"
                    : "border border-transparent hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin size={18} className={isActive ? "text-slate-900" : "text-gray-400"} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{branch.name}</p>
                    <p className="mt-1 text-sm text-gray-600">{branch.address}</p>

                    <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                      {branch.phone ? (
                        <span className="flex items-center gap-2">
                          <Phone size={14} />
                          {branch.phone}
                        </span>
                      ) : null}

                      {/* если поле у тебя называется по-другому — поправь в types.ts и API */}
                      {(branch as any).work_hours ? (
                        <span className="flex items-center gap-2">
                          <Clock size={14} />
                          {(branch as any).work_hours}
                        </span>
                      ) : null}
                    </div>

                    {/* маршрут */}
                    <div className="mt-3">
                      <a
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          `${(branch as any).latitude ?? (branch as any).lat},${(branch as any).longitude ?? (branch as any).lng}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation size={14} />
                        Построить маршрут
                      </a>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </aside>
      </div>

      {selected ? (
        <div className="mt-6 text-xs text-gray-500">
          Выбран филиал: <span className="font-medium text-gray-800">{selected.name}</span>
        </div>
      ) : null}
    </main>
  );
}