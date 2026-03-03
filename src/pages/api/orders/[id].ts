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
    admin
      .from("order_items")
      .select("id,order_id,variant_id,title_snapshot,quantity,price_kzt")
      .eq("order_id", orderId),
  ]);

  if (orderErr) return res.status(404).json({ error: orderErr.message });
  if (itemsErr) return res.status(500).json({ error: itemsErr.message });

  const safeItems = (items as OrderItemRow[] | null) ?? [];

  return res.status(200).json({
    ...order,
    items: safeItems,
  });
}