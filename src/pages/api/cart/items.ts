import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const getOrCreateCart = async (userId: string) => {
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin.from('carts').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await admin.from('carts').insert({ user_id: userId }).select('id').single();
  if (error || !data) throw new Error(error?.message || 'Unable to create cart');
  return data.id;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireUser(req, res);
  if (!auth) return;
  const admin = getSupabaseAdmin();
  const cartId = await getOrCreateCart(auth.user.id);

  if (req.method === 'POST') {
    const { variantId, quantity } = req.body;
    const qty = Math.max(1, Number(quantity || 1));
    const { data: existing } = await admin.from('cart_items').select('quantity').eq('cart_id', cartId).eq('variant_id', variantId).maybeSingle();
    if (existing) {
      const { error } = await admin.from('cart_items').update({ quantity: existing.quantity + qty }).eq('cart_id', cartId).eq('variant_id', variantId);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      const { error } = await admin.from('cart_items').insert({ cart_id: cartId, variant_id: variantId, quantity: qty });
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    const { variantId, quantity } = req.body;
    const qty = Number(quantity);
    if (qty <= 0) {
      await admin.from('cart_items').delete().eq('cart_id', cartId).eq('variant_id', variantId);
      return res.status(200).json({ ok: true });
    }
    const { error } = await admin.from('cart_items').update({ quantity: qty }).eq('cart_id', cartId).eq('variant_id', variantId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const variantId = String(req.query.variantId || '');
    const { error } = await admin.from('cart_items').delete().eq('cart_id', cartId).eq('variant_id', variantId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
