// src/pages/api/favorites/products.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/api-auth";
import type { CatalogVariant } from "@/lib/types";

type Row = { variant_id: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const admin = getSupabaseAdmin();

    // 1) Получаем variant_id из favorites
    const { data: favRows, error: favErr } = await admin
      .from("favorites")
      .select("variant_id")
      .eq("user_id", auth.user.id);

    if (favErr) return res.status(500).json({ error: favErr.message });

    const ids = ((favRows ?? []) as Row[])
      .map((x) => String(x.variant_id))
      .filter(Boolean);

    if (!ids.length) return res.status(200).json([]);

    // 2) Берём товары напрямую из БД по этим ids
    // ✅ лучше всего: v_catalog_variants (если она у тебя есть)
    const { data: products, error: prodErr } = await admin
      .from("v_catalog_variants")
      .select("*")
      .in("variant_id", ids);

    if (prodErr) {
      // если у тебя нет v_catalog_variants — покажем понятную ошибку
      return res.status(500).json({
        error:
          `Cannot load products from v_catalog_variants: ${prodErr.message}. ` +
          `Replace table/view name with yours (e.g. product_variants / catalog view).`,
      });
    }

    // 3) Сохраняем порядок как в избранных (опционально)
    const order = new Map(ids.map((id, i) => [id, i]));
    const sorted = (products ?? []).slice().sort((a: any, b: any) => {
      return (order.get(String(a.variant_id)) ?? 0) - (order.get(String(b.variant_id)) ?? 0);
    });

    return res.status(200).json(sorted as CatalogVariant[]);
  } catch (e: any) {
    console.error("favorites/products fatal:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}