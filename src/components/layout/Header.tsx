// src/components/layout/Header.tsx
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  Heart,
  User2,
  ShoppingCart,
  ChevronRight,
  MapPin,
  Tag,
  ShieldCheck,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Grid2X2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type HeaderProps = {
  showTopBar?: boolean;
};

export const Header = ({ showTopBar = true }: HeaderProps) => {
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [email, setEmail] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");

  const accountRef = useRef<HTMLDivElement | null>(null);

  const loadCartCount = async () => {
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

  const syncUser = async () => {
    const { data } = await supabase.auth.getUser();
    const userEmail = data.user?.email ?? null;
    setEmail(userEmail);
    if (data.user) await loadCartCount();
    else setCartCount(0);
  };

  useEffect(() => {
    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncUser();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setAccountOpen(false);
    setCartCount(0);
  };

  const goSearch = () => {
    const q = search.trim();
    const url = q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog";
    window.location.href = url;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
        {/* TOP BAR */}
        {showTopBar && (
          <div className="border-b border-gray-100">
            <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between gap-3 px-6 sm:px-8 lg:px-10">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-[15px] font-semibold text-gray-800 hover:bg-gray-200"
                >
                  <MapPin className="h-4.5 w-4.5" />
                  Астана
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-[15px] font-semibold text-gray-800 hover:bg-gray-200"
                >
                  Рус
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </button>
              </div>

              <div className="hidden items-center gap-7 text-[15px] font-semibold text-gray-600 md:flex">
                <Link className="hover:text-gray-900" href="/branches">
                  Адреса магазинов
                </Link>
                <Link className="hover:text-gray-900" href="/cart">
                  Корзина
                </Link>
                <Link className="hover:text-gray-900" href="/account">
                 История заказов
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/favorites"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-[15px] font-semibold text-gray-800 hover:bg-gray-200"
                >
                  <Heart className="h-4.5 w-4.5" />
                  Избранное
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MAIN HEADER */}
        <div className="border-b border-gray-100">
          <div className="mx-auto flex h-[84px] max-w-[1680px] items-center justify-between gap-5 px-6 sm:px-8 lg:px-10">
            {/* Left */}
            <div className="flex items-center gap-5">
              <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <span className="text-[18px] font-black">S</span>
                </div>
                <div className="leading-tight">
                  <div className="text-[15px] font-black tracking-wide text-gray-900">
                    Smart<span className="text-emerald-600">Shop</span>
                  </div>
                  <div className="text-[12px] font-semibold text-gray-500">marketplace</div>
                </div>
              </Link>

              <Link
                href="/catalog"
                className="hidden items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-[15px] font-black text-white shadow-sm hover:bg-emerald-700 md:inline-flex"
              >
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15">
                  <Grid2X2 className="h-4.5 w-4.5" />
                </span>
                Каталог
              </Link>

              <nav className="hidden items-center gap-8 text-[15px] font-semibold text-gray-600 lg:flex">
                <Link href="/branches" className="transition-colors hover:text-emerald-600">
                  Адреса магазинов
                </Link>
              </nav>
            </div>

            {/* Center: Search */}
            <div className="hidden flex-1 md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goSearch()}
                  placeholder="Поиск по моделям iPhone, Samsung…"
                  className="h-12 w-full rounded-2xl bg-gray-100 pl-12 pr-4 text-[15px] font-semibold outline-none placeholder:text-gray-400 focus:bg-gray-50 focus:ring-2 focus:ring-emerald-600/15"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2.5">
              {/* Mobile search */}
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 md:hidden"
                aria-label="Поиск"
                onClick={goSearch}
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href="/favorites"
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 hover:bg-gray-200"
                aria-label="Избранное"
              >
                <Heart className="h-5 w-5 text-emerald-600" />
              </Link>

              <Link
                href="/cart"
                className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 hover:bg-gray-200"
                aria-label="Корзина"
              >
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-600 px-2 text-[11px] font-black text-white shadow-sm ring-2 ring-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {email ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((v) => !v)}
                    className="flex items-center gap-2.5 rounded-2xl bg-gray-100 p-1 pr-3.5 text-gray-900 hover:bg-gray-200"
                    aria-label="Аккаунт"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 text-emerald-600 ring-1 ring-black/5">
                      <User2 className="h-5 w-5" />
                    </div>
                    <ChevronDown
                      className={[
                        "h-4 w-4 text-gray-600 transition-transform",
                        accountOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5"
                      >
                        <div className="mb-1 border-b border-gray-50 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Аккаунт</p>
                          <p className="truncate text-[14px] font-semibold text-gray-900">{email}</p>
                        </div>

                        <Link
                          href="/account"
                          className="block rounded-2xl px-4 py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                          onClick={() => setAccountOpen(false)}
                        >
                          Профиль
                        </Link>
                        <button
                          onClick={signOut}
                          className="mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold text-red-500 hover:bg-red-50"
                        >
                          <LogOut className="h-4.5 w-4.5" /> Выйти
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="hidden rounded-2xl bg-emerald-600 px-6 py-3 text-[15px] font-black text-white shadow-sm hover:bg-emerald-700 sm:inline-flex"
                >
                  Войти
                </Link>
              )}

              <button
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-200 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 z-[70] h-full w-full max-w-[360px] bg-white p-7 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-2xl font-black text-gray-900">Меню</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-gray-100 hover:bg-gray-200"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goSearch()}
                    placeholder="Поиск…"
                    className="h-12 w-full rounded-2xl bg-gray-100 pl-12 pr-4 text-[15px] font-semibold outline-none placeholder:text-gray-400 focus:bg-gray-50 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>
              </div>

              <nav className="flex flex-col gap-2 text-[16px] font-semibold">
                <Link
                  href="/catalog"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-5 py-3.5 hover:bg-gray-50"
                >
                  Каталог
                </Link>
                <Link
                  href="/branches"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-5 py-3.5 hover:bg-gray-50"
                >
                  Магазины
                </Link>
                <Link
                  href="/delivery"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-5 py-3.5 hover:bg-gray-50"
                >
                  Доставка
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-5 py-3.5 hover:bg-gray-50"
                >
                  Корзина
                  {cartCount > 0 && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-sm font-black text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="my-5 h-px bg-gray-100" />

                {email ? (
                  <button onClick={signOut} className="rounded-2xl px-5 py-3.5 text-left text-red-500 hover:bg-red-50">
                    Выйти
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl bg-emerald-600 py-3.5 text-center font-black text-white shadow-sm hover:bg-emerald-700"
                  >
                    Войти
                  </Link>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};