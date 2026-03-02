import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container-shell py-16">
      <section className="card-surface p-8 md:p-12">
        <p className="mb-4 text-sm text-gray-500">Новый уровень покупки смартфонов</p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl">SmartShop Store</h1>
        <p className="max-w-2xl text-base text-gray-600 md:text-lg">Премиальный каталог смартфонов, проверка остатков по филиалам Астаны, удобный самовывоз и моментальное подтверждение заказа.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/catalog" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white">Открыть каталог</Link>
          <Link href="/branches" className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium">Филиалы</Link>
        </div>
      </section>
    </main>
  );
}
