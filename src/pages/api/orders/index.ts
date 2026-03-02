import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const auth = await requireUser(req, res);
  if (!auth) return;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('orders')
    .select('id,created_at,status,total_kzt,branch_id,branches(name,address)')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}
