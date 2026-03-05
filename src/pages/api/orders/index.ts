import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  total_amount_kzt: number | null;
  branch_id: string | null;
  branches?: { name?: string | null; address?: string | null } | null;
};

type OrderItemPreview = {
  title_snapshot: string;
  quantity: number;
  price_kzt: number;
  variant_id: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = await requireUser(req, res);
  if (!auth) return;

  const admin = getSupabaseAdmin();

  // 1) Заказы (только поля заказа + филиал)
  const { data: orders, error } = await admin
    .from("orders")
    .select("id,created_at,status,total_amount_kzt,branch_id,branches(name,address)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = (orders ?? []) as OrderRow[];
  if (rows.length === 0) return res.status(200).json([]);

  // 2) Превью товаров: берем items по всем order_id одним запросом
  const orderIds = rows.map((o) => o.id);

  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("order_id,title_snapshot,quantity,price_kzt,variant_id")
    .in("order_id", orderIds)
    .order("id", { ascending: true });

  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  // 3) Группируем items по заказам
  const byOrder = new Map<string, OrderItemPreview[]>();

  for (const it of (items ?? []) as any[]) {
    const oid = String(it.order_id ?? "");
    if (!oid) continue;

    const arr = byOrder.get(oid) ?? [];
    arr.push({
      title_snapshot: String(it.title_snapshot ?? ""),
      quantity: Number(it.quantity ?? 0),
      price_kzt: Number(it.price_kzt ?? 0),
      variant_id: it.variant_id ? String(it.variant_id) : null,
    });
    byOrder.set(oid, arr);
  }

  // 4) Добавляем новые поля, не ломая старые
  const enhanced = rows.map((o) => {
    const arr = byOrder.get(o.id) ?? [];
    return {
      ...o,
      items_count: arr.length,
      items_preview: arr.slice(0, 3),
    };
  });

  return res.status(200).json(enhanced);
}