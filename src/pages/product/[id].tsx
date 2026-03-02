import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { CatalogVariant } from '@/lib/types';

export default function ProductPage() {
  const router = useRouter();
  const id = router.query.id;
  const [variants, setVariants] = useState<CatalogVariant[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch('/api/catalog/products')
      .then((r) => r.json())
      .then((data: CatalogVariant[]) => setVariants(data.filter((item) => item.product_id === id)));
  }, [id]);

  const product = variants[0];
  if (!product) return <main className="container-shell py-10">Загрузка...</main>;

  return (
    <main className="container-shell py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <img src={product.image_url || 'https://placehold.co/800x560?text=Smartphone'} alt={product.title} className="card-surface h-full w-full object-cover p-2" />
        <section className="card-surface p-6">
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <p className="mt-2 text-gray-600">{product.description || 'Флагманский смартфон с премиальными материалами и высокой производительностью.'}</p>
          <div className="mt-6 space-y-2">
            {variants.map((variant) => (
              <div key={variant.variant_id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                <span>{variant.memory_gb} ГБ · {variant.color}</span>
                <strong>{formatPrice(variant.price_kzt)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
