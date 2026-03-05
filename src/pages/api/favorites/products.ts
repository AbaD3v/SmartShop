import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/api-auth";
import type { CatalogVariant } from "@/lib/types";

type Row = { variant_id: string };

function normalizeCatalogResponse(json: any): CatalogVariant[] {
  const arr = Array.isArray(json) ? json : json?.data || json?.items || [];
  return arr as CatalogVariant[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("favorites")
    .select("variant_id")
    .eq("user_id", auth.user.id);

  if (error)
    return res.status(500).json({ error: error.message });

  const ids = ((data ?? []) as Row[]).map((x) => x.variant_id);

  if (!ids.length)
    return res.json([]);

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `http://${req.headers.host}`;

  const r = await fetch(`${base}/api/catalog/products`);
  const json = await r.json();

  const products = normalizeCatalogResponse(json);

  const set = new Set(ids);

  const favorites = products.filter(
    (p) => set.has(p.variant_id)
  );

  return res.json(favorites);
}