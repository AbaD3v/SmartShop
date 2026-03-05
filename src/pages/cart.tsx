// src/pages/cart.tsx
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { formatPrice } from "@/lib/format";
import type { CartResponse, CartItem } from "@/lib/types";
import { authedFetch } from "@/lib/authedFetch";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, 
  Loader2, AlertCircle, Sparkles, Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecommendedProducts } from "@/components/RecommendedProducts";
interface Product {
  id: string;
  title: string;
  price_kzt: number;
  image_url: string;
  category?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
};

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isRecLoading, setIsRecLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null); // Для анимации успеха

  const loadCart = useCallback(async () => {
    try {
      const res = await authedFetch("/api/cart");
      if (res.status === 401) {
        setCart({ cartId: "", items: [] });
        setMsg("Войдите в аккаунт, чтобы пользоваться корзиной.");
        return;
      }
      if (!res.ok) throw new Error("API Error");
      const json = await res.json();
      setCart(json.cart || json);
    } catch (e) {
      setMsg("Не удалось загрузить корзину.");
      setCart({ cartId: "", items: [] });
    }
  }, []);

  const loadRecommendations = async () => {
    try {
      const res = await fetch("/api/products?limit=8");
      if (!res.ok) return;
      const data = await res.json();
      setRecommended(Array.isArray(data) ? data : data.products || []);
    } catch (e) {
      console.error("Recs load failed", e);
    } finally {
      setIsRecLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    loadRecommendations();
  }, [loadCart]);

  const filteredRecs = useMemo(() => {
    const currentItems = cart?.items || [];
    const cartIds = new Set(currentItems.map(item => item.variant_id));
    const cartTitles = new Set(currentItems.map(item => item.title.split(' ')[0].toLowerCase())); 
    return recommended
      .filter(p => !cartIds.has(p.id) && !cartTitles.has(p.title.split(' ')[0].toLowerCase()))
      .slice(0, 6);
  }, [cart, recommended]);

  const total = useMemo(() => 
    (cart?.items || []).reduce((sum, i) => sum + i.quantity * i.price_kzt, 0), 
  [cart]);

  const updateQty = async (vId: string, qty: number) => {
    if (qty < 0 || loadingId) return;
    setLoadingId(vId);
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: vId, quantity: qty }),
      });
      if (res.ok) await loadCart();
    } finally {
      setLoadingId(null);
    }
  };

  // ТА САМАЯ ФУНКЦИЯ, КОТОРУЮ МЫ ПОТЕРЯЛИ + АНИМАЦИЯ
  const quickAdd = async (productId: string) => {
    if (loadingId) return;
    setLoadingId(productId);
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: productId, quantity: 1 }),
      });
      if (res.ok) {
        setAddedId(productId);
        await loadCart();
        setTimeout(() => setAddedId(null), 1500); // Сбрасываем иконку "Галочки"
      }
    } catch (e) {
      console.error("Quick add failed", e);
    } finally {
      setLoadingId(null);
    }
  };

  if (!cart) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-gray-900" size={32} />
      </div>
    );
  }

  const items = cart.items || [];

  return (
    <main className="mx-auto max-w-[1680px] px-6 py-12 md:px-10 md:py-20 lg:px-12 selection:bg-black selection:text-white">
      <header className="mb-16">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">Корзина</h1>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-lg font-medium text-gray-500">
              {items.length === 0 ? "Пусто" : `${items.length} товара в списке`}
            </p>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-10">
            <div className="flex items-center justify-between rounded-[24px] bg-amber-50/50 p-5 border border-amber-100/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-amber-900 font-medium text-sm md:text-base">
                <AlertCircle size={20} className="shrink-0" /> {msg}
              </div>
              {msg.includes("Войдите") && (
                <Link href="/auth" className="rounded-full bg-amber-900 px-5 py-2 text-xs md:text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95">
                  Войти
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-12 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
  <section>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[48px] border-2 border-dashed border-gray-100 bg-gray-50/30 py-32 text-center">
              <div className="mb-6 rounded-full bg-white p-6 shadow-sm"><ShoppingBag className="text-gray-300" size={40} /></div>
              <h2 className="mb-8 text-2xl font-bold text-gray-900">Пока здесь ничего нет</h2>
              <Link href="/catalog"><Button variant="secondary" className="!rounded-full px-10 h-14 font-bold border-2">Начать покупки</Button></Link>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((item) => (
                  <motion.article key={item.variant_id} variants={itemVariants} layout className="group relative flex items-center gap-7 rounded-[40px] border border-gray-100 bg-white p-7 transition-all hover:border-gray-200 hover:shadow-2xl hover:shadow-gray-200/50">
                    <div className="h-32 w-32 md:h-36 md:w-36 shrink-0 overflow-hidden rounded-[26px] bg-gray-50">
                      <img src={item.image_url || ""} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                     <h3 className="text-2xl font-black text-gray-900 line-clamp-1">{item.title}</h3>
<p className="text-[15px] font-semibold text-gray-400">{item.color}</p>
<p className="mt-3 text-2xl font-black text-gray-900 tracking-tight">{formatPrice(item.price_kzt)}</p>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-3xl bg-gray-50 p-3 border border-gray-100">
                      <button onClick={() => updateQty(item.variant_id, item.quantity - 1)} disabled={!!loadingId} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-gray-900 hover:text-white transition-all disabled:opacity-50">
                        {item.quantity <= 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} />}
                      </button>
                      <span className="min-w-[24px] text-center font-bold tabular-nums">{loadingId === item.variant_id ? <Loader2 size={14} className="animate-spin mx-auto" /> : item.quantity}</span>
                      <button onClick={() => updateQty(item.variant_id, item.quantity + 1)} disabled={!!loadingId} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-gray-900 hover:text-white transition-all disabled:opacity-50">
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <aside>
          <div className="sticky top-24 rounded-[44px] border border-gray-100 bg-white p-10 xl:p-12 shadow-2xl shadow-gray-200/50">
            <h2 className="text-3xl font-black mb-8">Резюме</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-[17px]"><span className="text-gray-400 font-medium">Сумма</span><span className="font-bold">{formatPrice(total)}</span></div>
              <div className="flex justify-between text-[17px]"><span className="text-gray-400 font-medium">Доставка</span><span className="text-emerald-500 font-bold uppercase text-xs tracking-widest">Бесплатно</span></div>
            </div>
            <div className="pt-8 border-t border-gray-50 flex items-end justify-between mb-10">
              <span className="font-bold text-gray-400">Итого</span>
              <span className="text-4xl font-black tracking-tighter tabular-nums">{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className={items.length === 0 ? "pointer-events-none" : "block group"}>
              <Button className="h-16 w-full !rounded-[22px] bg-black text-white hover:bg-gray-800 transition-all group-active:scale-[0.98]" rightIcon={<ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />} disabled={items.length === 0}>
                Оформить заказ
              </Button>
            </Link>
          </div>
        </aside>
      </div>

      {!isRecLoading && filteredRecs.length > 0 && (
        <section className="mt-32 border-t border-gray-100 pt-24">
          <div className="mb-12 flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-2 text-blue-600"><Sparkles size={24} fill="currentColor" className="opacity-20" /></div>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">Добавьте к заказу</h2>
          </div>
          <div className="hide-scrollbar -mx-6 flex gap-8 overflow-x-auto px-6 pb-12 snap-x snap-mandatory">
            {filteredRecs.map((product) => (
              <motion.div key={product.id} whileHover={{ y: -8 }} className="w-[280px] flex-shrink-0 snap-start group bg-white p-4 rounded-[36px] border border-gray-50 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
                <div className="relative mb-5 aspect-square overflow-hidden rounded-[28px] bg-gray-50">
                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                  <motion.button 
                    onClick={() => quickAdd(product.id)}
                    disabled={!!loadingId}
                    animate={addedId === product.id ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                    className={`absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all active:scale-90 disabled:bg-gray-200 ${
                      addedId === product.id ? "bg-emerald-500 text-white opacity-100" : "bg-black text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
                    }`}
                  >
                    {loadingId === product.id ? <Loader2 size={20} className="animate-spin" /> : 
                     addedId === product.id ? <Check size={24} strokeWidth={3} /> : <Plus size={24} />}
                  </motion.button>
                </div>
                <div className="px-2">
                  <h4 className="text-lg font-bold text-gray-900 truncate">{product.title}</h4>
                  <p className="mt-1 text-xl font-black text-gray-400">{formatPrice(product.price_kzt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      <RecommendedProducts onAdded={() => loadCart?.()} limit={6} />
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}