// src/lib/api-auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";

export type AuthResult = { user: { id: string; email?: string } };

export async function requireUser(req: NextApiRequest, res: NextApiResponse): Promise<AuthResult | null> {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing Authorization token" });
    return null;
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }

  return { user: { id: data.user.id, email: data.user.email ?? undefined } };
}