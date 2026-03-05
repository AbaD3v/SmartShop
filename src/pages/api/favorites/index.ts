import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireUser } from "@/lib/api-auth";

type Row = {
  variant_id: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("favorites")
    .select("variant_id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error)
    return res.status(500).json({ error: error.message });

  const ids = ((data ?? []) as Row[]).map((x) => x.variant_id);

  return res.status(200).json(ids);
}