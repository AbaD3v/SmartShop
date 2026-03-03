// src/lib/authedFetch.ts
import { getSupabaseBrowser } from "@/lib/supabase";

export async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const supabase = getSupabaseBrowser();

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(input, { ...init, headers });
}