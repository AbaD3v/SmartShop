import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/api-auth";

type Row = { id: string } | null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  const { variantId } = req.body ?? {};

  if (!variantId)
    return res.status(400).json({ error: "variantId required" });

  const admin = getSupabaseAdmin();

  const { data } = await admin
    .from("favorites")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  const existing = data as Row;

  if (existing?.id) {

    await admin
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    return res.json({ active: false });
  }

  await admin
    .from("favorites")
    .insert({
      user_id: auth.user.id,
      variant_id: variantId
    });

  return res.json({ active: true });
}