import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const set = useMemo(() => new Set(ids), [ids]);

  const refresh = async () => {
    const r = await authedFetch("/api/favorites");
    if (!r.ok) return;
    const data = (await r.json()) as string[];
    setIds(data);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFav = (variantId: string) => set.has(variantId);

  const toggle = async (variantId: string) => {
    // оптимистично
    const was = set.has(variantId);
    setIds(prev => (was ? prev.filter(x => x !== variantId) : [variantId, ...prev]));

    const r = await authedFetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });

    if (!r.ok) {
      // откат
      setIds(prev => (was ? [variantId, ...prev] : prev.filter(x => x !== variantId)));
      return;
    }

    const json = await r.json();
    const active = Boolean(json?.active);
    setIds(prev => {
      const has = prev.includes(variantId);
      if (active && !has) return [variantId, ...prev];
      if (!active && has) return prev.filter(x => x !== variantId);
      return prev;
    });
  };

  return { ids, isFav, toggle, refresh };
}