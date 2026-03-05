// src/pages/api/orders/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { buildReceiptHtml, sendReceiptEmail } from "@/lib/email";

type ReceiptItem = {
  title_snapshot: string;
  qty: number;
  unit_price_kzt: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const auth = await requireUser(req, res);
  if (!auth) return;

  const { branchId, customerEmail, customerName, customerPhone } = req.body ?? {};
  if (!branchId || !customerEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const admin = getSupabaseAdmin();

  // 1) Берём последнюю корзину пользователя, В КОТОРОЙ ЕСТЬ товары
  // cart_items!inner(...) гарантирует, что вернутся только carts с хотя бы 1 item
  const { data: cart, error: cartErr } = await admin
    .from("carts")
    .select("id, cart_items!inner(id)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cartErr) return res.status(500).json({ error: cartErr.message });
  if (!cart?.id) return res.status(400).json({ error: "Cart is empty" });

  const cartId = cart.id as string;

  // 2) Создаём заказ через RPC (нужна перегрузка с p_user_id)
  const { data: orderId, error: rpcErr } = await admin.rpc("create_pickup_order", {
    p_cart_id: cartId,
    p_branch_id: branchId,
    p_user_id: auth.user.id,
    p_customer_email: customerEmail,
    p_customer_name: customerName || null,
    p_customer_phone: customerPhone || null,
  });

if (rpcErr || !orderId) {
  const msg = String(rpcErr?.message ?? "Unable to create order");

  if (msg.toLowerCase().includes("not_enough_inventory")) {
    return res.status(409).json({
      error: "NOT_ENOUGH_INVENTORY",
      message: "Не хватает товара в выбранном филиале. Уменьшите количество или выберите другой филиал.",
    });
  }

  return res.status(400).json({ error: msg });
}

  // 3) Достаём order + items + branch
  const [
    { data: order, error: orderErr },
    { data: items, error: itemsErr },
    { data: branch, error: branchErr },
  ] = await Promise.all([
    admin.from("orders").select("id,created_at").eq("id", orderId).single(),
    // ✅ реальные поля в твоей БД: quantity, price_kzt
    admin.from("order_items").select("title_snapshot,quantity,price_kzt").eq("order_id", orderId),
    admin.from("branches").select("name,address").eq("id", branchId).single(),
  ]);

  if (orderErr) return res.status(500).json({ error: orderErr.message });
  if (itemsErr) return res.status(500).json({ error: itemsErr.message });
  if (branchErr) return res.status(500).json({ error: branchErr.message });

  // 4) Нормализуем items под buildReceiptHtml (чтобы не менять email.ts)
  const receiptItems: ReceiptItem[] = (items ?? []).map((it: any) => ({
    title_snapshot: String(it.title_snapshot ?? ""),
    qty: Number(it.quantity ?? 0),
    unit_price_kzt: Number(it.price_kzt ?? 0),
  }));

  const html = buildReceiptHtml({
    orderId,
    customerEmail,
    customerName,
    branchName: branch?.name || "Филиал",
    branchAddress: branch?.address || "",
    createdAt: order?.created_at || new Date().toISOString(),
    items: receiptItems,
  });

  const subject = `SmartShop: заказ #${String(orderId).slice(0, 8)}`;
  const text = `Заказ #${orderId}. Спасибо за покупку.`;

  // 5) Письмо: не ломаем заказ, если отправка не удалась
  let emailed = false;
  try {
    await sendReceiptEmail({ html, to: customerEmail, subject, text });
    emailed = true;
  } catch {
    emailed = false;
  }

  // 6) Лог чека в БД
  await admin.from("receipts").insert({
    order_id: orderId,
    sent_to_email: customerEmail,
    subject,
    html_snapshot: html,
  });

  return res.status(200).json({ orderId, emailed });
}