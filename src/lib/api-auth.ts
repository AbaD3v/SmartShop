import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/auth-helpers-nextjs';

export const requireUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: 'Missing Supabase env' });
    return null;
  }

  const parsedCookies = parseCookieHeader(req.headers.cookie ?? '');

  const supabase = createServerClient(url, key, {
    cookies: {
      get: (name) => parsedCookies.find((cookie) => cookie.name === name)?.value,
      set: (name, value, options) => {
        res.setHeader('Set-Cookie', serializeCookieHeader(name, value, options));
      },
      remove: (name, options) => {
        res.setHeader('Set-Cookie', serializeCookieHeader(name, '', { ...options, maxAge: 0 }));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return { user: data.user, supabase };
};
