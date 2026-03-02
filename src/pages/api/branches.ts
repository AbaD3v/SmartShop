import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}
