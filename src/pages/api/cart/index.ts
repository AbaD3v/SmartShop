import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

type CartJoinRow = {
  variant_id: string;
  quantity: number;
  product_variants: Array<{
    price_kzt: number;
    color: string;
    memory_gb: number;
    products: Array<{ title: string; brand: string; image_url?: string }>;
  }>;
};

const getOrCreateCart = async (userId: string) => {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin.from('carts').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await admin.from('carts').insert({ user_id: userId }).select('id').single();
  if (error || !data) throw new Error(error?.message || 'Unable to create cart');
  return data.id;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth = await requireUser(req, res);
  if (!auth) return;

  try {
    const cartId = await getOrCreateCart(auth.user.id);
    const { data, error } = await getSupabaseAdmin()
      .from('cart_items')
      .select('variant_id, quantity, product_variants!inner(price_kzt,color,memory_gb,products!inner(title,brand,image_url))')
      .eq('cart_id', cartId);

    if (error) return res.status(500).json({ error: error.message });

    const items = ((data as unknown as CartJoinRow[]) ?? []).map((row) => {
      const variant = row.product_variants[0];
      const product = variant?.products[0];
      return {
        variant_id: row.variant_id,
        quantity: row.quantity,
        price_kzt: variant?.price_kzt ?? 0,
        color: variant?.color ?? '',
        memory_gb: variant?.memory_gb ?? 0,
        title: product?.title ?? '',
        brand: product?.brand ?? '',
        image_url: product?.image_url,
      };
    });

    return res.status(200).json({ cartId, items });
  } catch (e: unknown) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
}
