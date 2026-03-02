import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

export const Header = () => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then((result: { data: { user: { email?: string } | null } }) => { const { data } = result; setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold">SmartShop</Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/catalog">Каталог</Link>
          <Link href="/branches">Филиалы</Link>
          <Link href="/cart">Корзина</Link>
          <Link href="/account">Аккаунт</Link>
          {email ? <span className="text-xs text-gray-500">{email}</span> : <Link href="/auth">Войти</Link>}
        </nav>
      </div>
    </header>
  );
};
