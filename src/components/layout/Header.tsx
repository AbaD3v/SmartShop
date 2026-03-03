import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ShoppingBag, User, LogOut, ChevronDown, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const Header = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const accountRef = useRef<HTMLDivElement | null>(null);

  const loadUserAndCart = async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);

    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        setCartCount(0);
        return;
      }
      const json = await res.json();
      const items = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.cart?.items)
        ? json.cart.items
        : [];
      const count = items.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      if (data.user) loadUserAndCart();
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setEmail(null);
    setAccountOpen(false);
  };

  const goSearch = () => {
    const q = search.trim();
    const url = q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog";
    window.location.href = url;
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/70 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <button
              className="group relative flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-gray-100 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>

            <Link 
              href="/" 
              className="text-[19px] font-semibold tracking-[-0.02em] text-gray-900 transition-opacity hover:opacity-70"
            >
              SmartShop
            </Link>

            <nav className="hidden items-center gap-7 text-[13px] font-medium text-gray-500 md:flex">
              <Link href="/catalog" className="transition-colors hover:text-gray-900">
                Каталог
              </Link>
              <Link href="/branches" className="transition-colors hover:text-gray-900">
                Филиалы
              </Link>
            </nav>
          </div>

          <div className="hidden max-w-sm flex-1 px-8 md:block">
            <div className="relative group">
              <Input
                uiSize="md"
                className="w-full !rounded-full border-gray-200/70 bg-gray-50/50 pl-10 text-[13px] ring-offset-transparent transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.03)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goSearch()}
                placeholder="Поиск продуктов"
                leftIcon={<Search size={15} className="text-gray-400 group-focus-within:text-gray-900 transition-colors" />}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.div whileTap={{ scale: 0.95 }} className="relative">
              <Link
                href="/cart"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-gray-100"
                aria-label="Корзина"
              >
                <ShoppingBag size={19} strokeWidth={1.5} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute right-[2px] top-[2px] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-sm"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            {email ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-10 items-center gap-2 rounded-full border border-gray-200/70 bg-white pl-1 pr-3 transition-all hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <User size={15} strokeWidth={2} />
                  </div>
                  <span className="max-w-[120px] truncate text-[13px] font-medium text-gray-700">
                    {email.split("@")[0]}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`text-gray-400 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} 
                  />
                </button>

                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] backdrop-blur-xl"
                    >
                      <Link
                        href="/account"
                        className="flex items-center rounded-[14px] px-3 py-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Аккаунт
                      </Link>
                      <Link
                        href="/account/orders"
                        className="flex items-center rounded-[14px] px-3 py-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Мои заказы
                      </Link>
                      <div className="my-1 h-px bg-gray-100" />
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-2 rounded-[14px] px-3 py-2.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={14} />
                        Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:block">
                <Link href="/auth">
                  <Button 
                    variant="secondary" 
                    className="h-10 !rounded-full bg-black px-5 text-[13px] font-medium text-white hover:bg-gray-800"
                  >
                    Войти
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-[70] h-full w-full max-w-[320px] border-l border-gray-100 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[17px] font-semibold tracking-tight">Меню</span>
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-colors active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 group">
                <Input
                  uiSize="md"
                  className="!rounded-2xl border-gray-100 bg-gray-50/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setMobileOpen(false);
                      goSearch();
                    }
                  }}
                  placeholder="Поиск продуктов..."
                  leftIcon={<Search size={16} className="text-gray-400" />}
                />
              </div>

              <nav className="flex flex-col gap-1">
                {[
                  { label: "Каталог", href: "/catalog" },
                  { label: "Филиалы", href: "/branches" },
                  { label: "Корзина", href: "/cart" },
                  { label: "Аккаунт", href: "/account" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-2xl px-4 py-3.5 text-[15px] font-medium text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  {email ? (
                    <Button 
                      variant="secondary" 
                      className="w-full !rounded-[18px] h-12" 
                      onClick={signOut} 
                      leftIcon={<LogOut size={16} />}
                    >
                      Выйти
                    </Button>
                  ) : (
                    <Link href="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="secondary" className="w-full !rounded-[18px] h-12 bg-black text-white hover:bg-gray-800">
                        Войти
                      </Button>
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};