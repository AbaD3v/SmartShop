import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const auth = await requireUser(req, res);
  if (!auth) return;

  const orderId = String(req.query.id || '');
  const admin = getSupabaseAdmin();

  const [{ data: order, error }, { data: items }] = await Promise.all([
    admin.from('orders').select('id,created_at,status,total_kzt,customer_name,customer_phone,customer_email,branches(name,address)').eq('id', orderId).eq('user_id', auth.user.id).single(),
    admin.from('order_items').select('*').eq('order_id', orderId),
  ]);

  if (error) return res.status(404).json({ error: error.message });
  return res.status(200).json({ ...order, items: items ?? [] });
}
