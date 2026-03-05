// src/pages/api/orders/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string | null;
  title_snapshot: string;
  quantity: number;
  price_kzt: number;

  // join from view/table
  v_catalog_variants?: {
    image_url?: string | null;
    base_image_url?: string | null;
    color?: string | null;
    memory_gb?: number | null;
    storage_gb?: number | null;
  } | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = await requireUser(req, res);
  if (!auth) return;

  const orderId = String(req.query.id || "");
  if (!orderId) return res.status(400).json({ error: "Missing order id" });

  const admin = getSupabaseAdmin();

  const [{ data: order, error: orderErr }, { data: items, error: itemsErr }] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id,created_at,status,total_amount_kzt,customer_name,customer_phone,customer_email,branches(name,address)"
      )
      .eq("id", orderId)
      .eq("user_id", auth.user.id)
      .single(),

    // ВАЖНО:
    // - мы НЕ делаем inner join, чтобы заказ не ломался если variant_id=null
    // - view v_catalog_variants должна быть доступна (у тебя она уже есть на главной)
    admin
      .from("order_items")
      .select(
        "id,order_id,variant_id,title_snapshot,quantity,price_kzt,v_catalog_variants(image_url,base_image_url,color,memory_gb,storage_gb)"
      )
      .eq("order_id", orderId),
  ]);

  if (orderErr) return res.status(404).json({ error: orderErr.message });
  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  const safeItems = ((items as OrderItemRow[] | null) ?? []).map((it) => ({
    id: String(it.id),
    order_id: String(it.order_id),
    variant_id: it.variant_id ? String(it.variant_id) : null,
    title_snapshot: String(it.title_snapshot ?? ""),
    quantity: Number(it.quantity ?? 0),
    price_kzt: Number(it.price_kzt ?? 0),

    // поля для превью и характеристик
    image_url:
      it.v_catalog_variants?.image_url ||
      it.v_catalog_variants?.base_image_url ||
      null,
    color: it.v_catalog_variants?.color ?? null,
    memory_gb: it.v_catalog_variants?.memory_gb ?? null,
    storage_gb: it.v_catalog_variants?.storage_gb ?? null,
  }));

  return res.status(200).json({
    ...order,
    items: safeItems,
  });
}