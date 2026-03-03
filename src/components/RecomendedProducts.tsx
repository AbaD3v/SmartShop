import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Star, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { authedFetch } from "@/lib/authedFetch";
import { Button } from "@/components/ui/Button";

interface Product {
  id: string;
  title: string;
  price_kzt: number;
  image_url: string;
  category: string;
}

export function RecommendedProducts({ onAdded }: { onAdded: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    // В реальном проекте здесь будет вызов API: /api/products/recommended
    // Сейчас имитируем загрузку популярных товаров
    const mockProducts: Product[] = [
      { id: "1", title: "Apple Clear Case (MagSafe)", price_kzt: 29990, image_url: "https://placehold.co/400x400?text=Case", category: "Аксессуары" },
      { id: "2", title: "AirPods Pro 2", price_kzt: 124990, image_url: "https://placehold.co/400x400?text=AirPods", category: "Аудио" },
      { id: "3", title: "USB-C Power Adapter 20W", price_kzt: 12990, image_url: "https://placehold.co/400x400?text=Adapter", category: "Зарядка" },
      { id: "4", title: "AirTag (1 pack)", price_kzt: 18990, image_url: "https://placehold.co/400x400?text=AirTag", category: "Аксессуары" },
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 800);
  }, []);

  const addToCart = async (productId: string) => {
    setAddingId(productId);
    try {
      // Здесь предполагаем, что у вас есть эндпоинт для добавления по ID товара/варианта
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId: productId, quantity: 1 }),
      });
      if (res.ok) onAdded(); // Обновляем основную корзину
    } finally {
      setAddingId(null);
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Ищем лучшее для вас...</div>;

  return (
    <section className="mt-24">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Вам также может понравиться</h2>
        <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          Популярное в Астане
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative flex flex-col rounded-[28px] border border-gray-100 bg-white p-4 transition-all hover:shadow-xl hover:shadow-gray-200/50"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-[20px] bg-gray-50">
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
            <div className="flex flex-1 flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {product.category}
              </span>
              <h3 className="mt-1 text-[15px] font-medium leading-tight text-gray-900">
                {product.title}
              </h3>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{formatPrice(product.price_kzt)}</span>
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={addingId === product.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:scale-110 active:scale-95 disabled:bg-gray-200"
                >
                  {addingId === product.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}