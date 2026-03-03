import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { CartResponse, CartItem } from "@/lib/types";
import { authedFetch } from "@/lib/authedFetch";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  Loader2, AlertCircle, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Локальный интерфейс для продукта, чтобы избежать ошибок импорта
interface Product {
  id: string;
  title: string;
  price_kzt: number;
  image_url: string;
  category?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isRecLoading, setIsRecLoading] = useState(true);

  // Загрузка корзины
  const loadCart = async () => {
    try {
      const res = await authedFetch("/api/cart");
      if (res.status === 401) {
        setCart({ cartId: "", items: [] });
        setMsg("Войдите в аккаунт, чтобы пользоваться корзиной.");
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        throw new Error("Invalid response from cart API");
      }

      const json = await res.json();
      setCart(json.cart ? json.cart : json);
    } catch (e) {
      setMsg("Не удалось загрузить корзину.");
      setCart({ cartId: "", items: [] });
    }
  };

  // Загрузка реальных товаров для рекомендаций
  const loadRecommendations = async () => {
    try {
      const res = await fetch("/api/products?limit=8");
      const contentType = res.headers.get("content-type");
      
      if (!res.ok || !contentType?.includes("application/json")) {
        console.warn("Recommendations API returned non-JSON response");
        return;
      }

      const data = await res.json();
      const prods = Array.isArray(data) ? data : data.products || [];
      setRecommended(prods);
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      setIsRecLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    loadRecommendations();
  }, []);

  // Фильтруем рекомендации: убираем то, что уже в корзине (по названию или ID)
  const filteredRecs = useMemo(() => {
    if (!cart?.items) return recommended;
    const cartIds = new Set(cart.items.map(item => item.variant_id));
    // Дополнительно фильтруем по заголовкам, чтобы не предлагать тот же iPhone другого цвета
    const cartTitles = new Set(cart.items.map(item => item.title.split(' ')[0])); 
    
    return recommended.filter(p => 
      !cartIds.has(p.id) && !cartTitles.has(p.title.split(' ')[0])
    ).slice(0, 6);
  }, [cart, recommended]);

  const total = useMemo(() => 
    (cart?.items || []).reduce((sum, i) => sum + i.quantity * i.price_kzt, 0), 
  [cart]);

  const updateQty = async (vId: string, qty: number) => {
    if (qty < 0) return;
    setLoadingId(vId);
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "PATCH",
        body: JSON.stringify({ variantId: vId, quantity: qty }),
      });
      if (res.ok) await loadCart();
    } finally {
      setLoadingId(null);
    }
  };

  const quickAdd = async (productId: string) => {
    setLoadingId(productId);
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId: productId, quantity: 1 }),
      });
      if (res.ok) await loadCart();
    } finally {
      setLoadingId(null);
    }
  };

  if (!cart) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-gray-200" size={40} />
      </div>
    );
  }

  const items = cart.items || [];

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-12 md:py-20 selection:bg-black selection:text-white">
      <header className="mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-[40px] font-semibold tracking-tight text-gray-900 md:text-[48px]">
            Корзина
          </h1>
          <p className="mt-2 text-[17px] text-gray-500">
            {items.length === 0 ? "Ваша корзина пуста" : `${items.length} предмета в списке`}
          </p>
        </motion.div>
      </header>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-100">
              <div className="flex items-center gap-3 text-sm text-amber-800">
                <AlertCircle size={18} />
                {msg}
              </div>
              {msg.includes("Войдите") && <Link href="/auth" className="text-sm font-bold text-amber-900 underline">Войти</Link>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-8">
          {items.length === 0 ? (
            <div className="rounded-[40px] border border-dashed border-gray-200 bg-white py-24 text-center">
              <ShoppingBag className="mx-auto mb-4 text-gray-200" size={48} />
              <Link href="/catalog">
                <Button variant="secondary" className="!rounded-full px-8">Перейти в каталог</Button>
              </Link>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.article key={item.variant_id} variants={itemVariants} layout className="group relative flex items-center gap-4 rounded-[28px] border border-gray-100 bg-white p-4 md:p-6 transition-all hover:shadow-lg hover:shadow-gray-100">
                    <img src={item.image_url || ""} alt="" className="h-24 w-24 rounded-[20px] bg-gray-50 object-cover" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.color}</p>
                      <p className="mt-2 text-lg font-bold">{formatPrice(item.price_kzt)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 p-1">
                      <button onClick={() => updateQty(item.variant_id, item.quantity - 1)} disabled={loadingId === item.variant_id} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                        {item.quantity <= 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} />}
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {loadingId === item.variant_id ? <Loader2 size={12} className="animate-spin mx-auto" /> : item.quantity}
                      </span>
                      <button onClick={() => updateQty(item.variant_id, item.quantity + 1)} disabled={loadingId === item.variant_id} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Ваш заказ</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Товары</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Доставка</span>
                <span>Бесплатно</span>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-50 flex items-end justify-between mb-8">
              <span className="font-semibold text-gray-900">Итого</span>
              <span className="text-3xl font-bold tracking-tight">{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className={items.length === 0 ? "pointer-events-none" : ""}>
              <Button className="h-14 w-full !rounded-2xl bg-black text-white" rightIcon={<ArrowRight size={20} />} disabled={items.length === 0}>
                Оформить заказ
              </Button>
            </Link>
          </div>
        </aside>
      </div>

      {/* РЕКОМЕНДАЦИИ С ГОРИЗОНТАЛЬНЫМ СКРОЛЛОМ */}
      {!isRecLoading && filteredRecs.length > 0 && (
        <section className="mt-24 pt-20 border-t border-gray-100">
          <div className="mb-8 flex items-center gap-2 text-blue-600">
            <Sparkles size={20} />
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Часто покупают вместе</h2>
          </div>

          <div className="hide-scrollbar -mx-6 flex gap-6 overflow-x-auto px-6 pb-8 snap-x snap-mandatory">
            {filteredRecs.map((product) => (
              <motion.div key={product.id} className="w-[260px] flex-shrink-0 snap-start group">
                <div className="relative mb-4 aspect-square overflow-hidden rounded-[30px] bg-gray-50">
                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button 
                    onClick={() => quickAdd(product.id)}
                    disabled={loadingId === product.id}
                    className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                  >
                    {loadingId === product.id ? <Loader2 size={18} className="animate-spin" /> : <Plus size={22} />}
                  </button>
                </div>
                <h4 className="font-semibold text-gray-900 truncate px-1">{product.title}</h4>
                <p className="mt-1 text-[17px] font-medium text-gray-500 px-1">{formatPrice(product.price_kzt)}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}