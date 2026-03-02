import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { brand, memory, color, q, minPrice, maxPrice } = req.query;
  const supabase = getSupabaseAdmin();

  let query = supabase.from('v_catalog_variants').select('*').eq('is_active', true);

  if (brand) query = query.eq('brand', brand);
  if (memory) query = query.eq('memory_gb', Number(memory));
  if (color) query = query.eq('color', color);
  if (minPrice) query = query.gte('price_kzt', Number(minPrice));
  if (maxPrice) query = query.lte('price_kzt', Number(maxPrice));
  if (q) query = query.ilike('title', `%${String(q)}%`);

  const { data, error } = await query.order('price_kzt', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data ?? []);
}
