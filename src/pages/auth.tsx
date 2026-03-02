import { useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowser } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = String(router.query.next || '/catalog');
    const { error } = await getSupabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });
    setMessage(error ? error.message : 'Проверьте email для входа');
  };

  return (
    <main className="container-shell py-16">
      <form onSubmit={submit} className="card-surface mx-auto max-w-md p-6">
        <h1 className="mb-2 text-2xl font-semibold">Вход по email</h1>
        <p className="mb-4 text-sm text-gray-600">Отправим magic link для входа и оформления заказа.</p>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 h-11 w-full rounded-xl border border-gray-200 px-3" placeholder="you@example.com" />
        <button className="h-11 w-full rounded-xl bg-slate-900 text-white">Отправить ссылку</button>
        {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
      </form>
    </main>
  );
}
