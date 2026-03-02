import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { buildReceiptHtml, sendReceiptEmail } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireUser(req, res);
  if (!auth) return;

  const { branchId, customerEmail, customerName, customerPhone } = req.body;
  if (!branchId || !customerEmail) return res.status(400).json({ error: 'Missing required fields' });

  const admin = getSupabaseAdmin();
  const { data: cart } = await admin.from('carts').select('id').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (!cart?.id) return res.status(400).json({ error: 'Cart is empty' });

  const { data: orderId, error } = await admin.rpc('create_pickup_order', {
    p_cart_id: cart.id,
    p_branch_id: branchId,
    p_customer_email: customerEmail,
    p_customer_name: customerName || null,
    p_customer_phone: customerPhone || null,
  });

  if (error || !orderId) return res.status(400).json({ error: error?.message || 'Unable to create order' });

  const [{ data: order }, { data: items }, { data: branch }] = await Promise.all([
    admin.from('orders').select('id,created_at').eq('id', orderId).single(),
    admin.from('order_items').select('title_snapshot,qty,unit_price_kzt').eq('order_id', orderId),
    admin.from('branches').select('name,address').eq('id', branchId).single(),
  ]);

  const html = buildReceiptHtml({
    orderId,
    customerEmail,
    customerName,
    branchName: branch?.name || 'Филиал',
    branchAddress: branch?.address || '',
    createdAt: order?.created_at || new Date().toISOString(),
    items: items || [],
  });

  const subject = `SmartShop: заказ #${orderId.slice(0, 8)}`;
  const text = `Заказ #${orderId}. Спасибо за покупку.`;

  await sendReceiptEmail({ html, to: customerEmail, subject, text }).catch(() => null);

  await admin.from('receipts').insert({
    order_id: orderId,
    sent_to_email: customerEmail,
    subject,
    html_snapshot: html,
  });

  return res.status(200).json({ orderId });
}
