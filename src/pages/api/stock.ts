import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const branchId = String(req.query.branchId || '');
  if (!branchId) return res.status(400).json({ error: 'branchId is required' });

  const { data, error } = await getSupabaseAdmin().from('v_branch_variant_stock').select('*').eq('branch_id', branchId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}
