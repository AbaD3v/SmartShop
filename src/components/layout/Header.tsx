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
    loadUserAndCart();

    const onDocClick = (e: MouseEvent) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);

    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setEmail(null);
    setAccountOpen(false);
  };

  const goSearch = () => {
    const q = search.trim();
    // Apple-style: поиск ведёт в каталог с параметром q
    const url = q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog";
    window.location.href = url;
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container-shell flex h-16 items-center justify-between gap-3">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-2">
            <button
              className="md:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="text-lg font-semibold tracking-tight text-gray-900 hover:opacity-70">
              SmartShop
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden items-center gap-8 text-sm text-gray-600 md:flex">
            <Link href="/catalog" className="transition hover:text-gray-900">
              Каталог
            </Link>
            <Link href="/branches" className="transition hover:text-gray-900">
              Филиалы
            </Link>
          </nav>

          {/* Search (desktop only) */}
          <div className="hidden w-[360px] md:block">
            <Input
              uiSize="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goSearch();
              }}
              placeholder="Поиск (iPhone, S24...)"
              leftIcon={<Search size={16} />}
            />
          </div>

          {/* Right: cart + account */}
          <div className="flex items-center gap-2">
            {/* Cart icon button */}
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link
                href="/cart"
                className="relative rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                aria-label="Корзина"
              >
                <ShoppingBag size={18} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-slate-900 px-1 text-[10px] font-medium text-white"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            {/* Account */}
            {email ? (
              <div className="relative" ref={accountRef}>
                <Button
                  variant="secondary"
                  className="h-10 px-3 text-xs"
                  onClick={() => setAccountOpen((v) => !v)}
                  leftIcon={<User size={14} />}
                  rightIcon={<ChevronDown size={14} className="text-gray-400" />}
                >
                  <span className="max-w-[140px] truncate">{email}</span>
                </Button>

                <AnimatePresence>
                  {accountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                    >
                      <Link
                        href="/account"
                        className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Аккаунт
                      </Link>

                      <Link
                        href="/account"
                        className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Мои заказы
                      </Link>

                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                      >
                        <LogOut size={16} className="text-gray-500" />
                        Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:block">
                <Link href="/auth">
                  <Button variant="secondary" className="h-10">
                    Войти
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="fixed right-0 top-0 z-50 h-full w-72 bg-white p-6 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Меню</span>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              {/* Mobile search uses Input */}
              <div className="mb-5">
                <Input
                  uiSize="md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setMobileOpen(false);
                      goSearch();
                    }
                  }}
                  placeholder="Поиск..."
                  leftIcon={<Search size={16} />}
                />
              </div>

              <nav className="flex flex-col gap-2">
                <Link href="/catalog" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-gray-50">
                  Каталог
                </Link>
                <Link href="/branches" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-gray-50">
                  Филиалы
                </Link>
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-gray-50">
                  Корзина
                </Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-gray-800 hover:bg-gray-50">
                  Аккаунт
                </Link>

                <div className="mt-4">
                  {email ? (
                    <Button variant="secondary" className="w-full" onClick={signOut} leftIcon={<LogOut size={16} />}>
                      Выйти
                    </Button>
                  ) : (
                    <Link href="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="secondary" className="w-full">
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