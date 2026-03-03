// src/pages/api/catalog/products.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";

const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const asNumber = (v: string | string[] | undefined) => {
  const s = asString(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseAdmin();

  const brand = asString(req.query.brand);
  const memory = asNumber(req.query.memory);
  const color = asString(req.query.color);
  const q = asString(req.query.q);
  const minPrice = asNumber(req.query.minPrice);
  const maxPrice = asNumber(req.query.maxPrice);
  const productId = asString(req.query.productId);

  let query = supabase.from("v_catalog_variants").select("*").eq("is_active", true);

  if (productId) query = query.eq("product_id", productId);
  if (brand) query = query.eq("brand", brand);
  if (memory !== undefined) query = query.eq("memory_gb", memory);
  if (color) query = query.eq("color", color);
  if (minPrice !== undefined) query = query.gte("price_kzt", minPrice);
  if (maxPrice !== undefined) query = query.lte("price_kzt", maxPrice);

  if (q) {
    const term = `%${q}%`;
    query = query.or(`product_name.ilike.${term},brand.ilike.${term},sku.ilike.${term}`);
  }

  const { data, error } = await query.order("price_kzt", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}