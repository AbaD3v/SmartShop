import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { CatalogVariant } from "@/lib/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const rawId = String(req.query.id ?? "").trim();
  if (!rawId) return res.status(400).json({ error: "Missing id" });

  const admin = getSupabaseAdmin();

  // 1) Сначала пробуем найти одну строку по variant_id
  const { data: oneByVariant } = await admin
    .from("v_catalog_variants")
    .select("*")
    .eq("variant_id", rawId)
    .maybeSingle();

  // Если нашли variant -> знаем product_id
  const productId = oneByVariant?.product_id
    ? String(oneByVariant.product_id)
    : rawId; // иначе считаем что rawId это product_id

  // 2) Теперь грузим ВСЕ варианты по product_id
  const { data: variants, error } = await admin
    .from("v_catalog_variants")
    .select("*")
    .eq("product_id", productId);

  if (error) return res.status(500).json({ error: error.message });

  const arr = (variants ?? []) as CatalogVariant[];

  if (!arr.length) {
    return res.status(404).json({
      error: "Product not found",
      debug: { rawId, resolvedProductId: productId },
    });
  }

  // 3) Если в URL был variant_id — отдадим preferredVariantId
  const preferredVariantId = oneByVariant?.variant_id
    ? String(oneByVariant.variant_id)
    : null;

  return res.status(200).json({
    product_id: productId,
    preferred_variant_id: preferredVariantId,
    variants: arr,
  });
}