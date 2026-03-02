import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowser } from '@/lib/supabase';
import type { Branch } from '@/lib/types';

type AuthResult = { data: { user: { email?: string } | null } };

export default function CheckoutPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then((result: AuthResult) => {
      const user = result.data.user;
      if (!user) router.replace('/auth?next=/checkout');
      else setEmail(user.email || '');
    });
    fetch('/api/branches').then((r) => r.json()).then(setBranches);
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId, customerEmail: email, customerName: name, customerPhone: phone }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Ошибка');
    router.push(`/account/${data.orderId}`);
  };

  return (
    <main className="container-shell py-10">
      <h1 className="mb-6 text-3xl font-semibold">Оформление заказа</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="mb-4 text-xl font-medium">Контакты</h2>
          <div className="space-y-3">
            <input className="h-11 w-full rounded-xl border border-gray-200 px-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="h-11 w-full rounded-xl border border-gray-200 px-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
            <input className="h-11 w-full rounded-xl border border-gray-200 px-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
          </div>
        </section>
        <section className="card-surface p-5">
          <h2 className="mb-4 text-xl font-medium">Филиал самовывоза</h2>
          <div className="space-y-2">
            {branches.map((branch) => (
              <label key={branch.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-3">
                <input type="radio" name="branch" checked={branchId === branch.id} onChange={() => setBranchId(branch.id)} required />
                <span><strong>{branch.name}</strong><br /><small className="text-gray-500">{branch.address}</small></span>
              </label>
            ))}
          </div>
          <button className="mt-4 h-11 w-full rounded-xl bg-slate-900 text-white">Подтвердить заказ</button>
        </section>
      </form>
    </main>
  );
}
