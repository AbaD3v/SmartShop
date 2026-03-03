// pages/api/cart/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type CartItemRow = { variant_id: string; quantity: number };

const getOrCreateCart = async (userId: string) => {
  const admin = getSupabaseAdmin();

  const { data: existing, error: exErr } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message || "Unable to create cart");
  return data.id;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const admin = getSupabaseAdmin();
    const cartId = await getOrCreateCart(auth.user.id);

    // 1) cart_items
    const { data: itemRows, error: itemsErr } = await admin
      .from("cart_items")
      .select("variant_id,quantity")
      .eq("cart_id", cartId);

    if (itemsErr) return res.status(500).json({ error: itemsErr.message });

    const rows = (itemRows as CartItemRow[]) ?? [];
    if (rows.length === 0) return res.status(200).json({ cartId, items: [] });

    const variantIds = rows.map((r) => r.variant_id);

    // 2) details from view
    const { data: variants, error: vErr } = await admin
      .from("v_catalog_variants")
      .select("variant_id,product_id,brand,title,product_name,description,image_url,base_image_url,price_kzt,color,memory_gb")
      .in("variant_id", variantIds);

    if (vErr) return res.status(500).json({ error: vErr.message });

    const byId = new Map((variants ?? []).map((v: any) => [v.variant_id, v]));

    // 3) merge
    const items = rows
      .map((r) => {
        const v: any = byId.get(r.variant_id);
        if (!v) return null;
        return {
          variant_id: r.variant_id,
          quantity: r.quantity,
          price_kzt: v.price_kzt ?? 0,
          color: v.color ?? "",
          memory_gb: v.memory_gb ?? 0,
          title: v.title ?? v.product_name ?? "",
          brand: v.brand ?? "",
          image_url: v.image_url ?? v.base_image_url ?? null,
          product_id: v.product_id ?? null,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ cartId, items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}