import { useEffect, useState } from 'react';
import type { Branch } from '@/lib/types';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Branch | null>(null);

  useEffect(() => {
    fetch('/api/branches').then((r) => r.json()).then((data) => {
      setBranches(data);
      setSelected(data[0] || null);
    });
  }, []);

  const mapQuery = selected ? encodeURIComponent(`${selected.latitude},${selected.longitude}`) : encodeURIComponent('Astana');

  return (
    <main className="container-shell py-10">
      <h1 className="mb-6 text-3xl font-semibold">Филиалы в Астане</h1>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="card-surface overflow-hidden">
          <iframe title="Карта филиалов" className="h-[460px] w-full border-0" src={`https://maps.google.com/maps?q=${mapQuery}&z=13&output=embed`} />
        </div>
        <aside className="space-y-2">
          {branches.map((branch) => (
            <button key={branch.id} onClick={() => setSelected(branch)} className={`card-surface w-full p-4 text-left ${selected?.id === branch.id ? 'border-slate-400' : ''}`}>
              <p className="font-medium">{branch.name}</p>
              <p className="text-sm text-gray-600">{branch.address}</p>
            </button>
          ))}
        </aside>
      </div>
    </main>
  );
}
