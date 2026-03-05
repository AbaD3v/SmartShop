// src/pages/index.tsx
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { CatalogVariant } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Watch,
  Headphones,
  Cable,
  Gift,
  Sparkles,
  Grid2X2,
  BadgePercent,
  WashingMachine,
  ArrowRight,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

type BannerSlide = {
  id: string;
  eyebrow: string;
  titleLines: string[];
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  // NEW: визуальный стиль для каждого слайда
  gradient: string; // tailwind arbitrary gradient
  glow: string; // подсветка для "блобов"
  accent: "emerald" | "sky" | "amber";
};

type Category = {
  id: string;
  title: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function clampText(s: string | null | undefined, max = 70) {
  const t = (s ?? "").trim();
  if (!t) return "Товар";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function pickImage(v: any) {
  return (
    v?.image_url ||
    v?.base_image_url ||
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
  );
}

function calcMonthly(price: number, months = 24) {
  if (!price || price <= 0) return 0;
  return Math.max(1, Math.round(price / months));
}

function safeId(v: any) {
  return v?.variant_id || v?.product_id || v?.id || "";
}

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3000);
  };
  // ===== Favorites =====
  const [favIds, setFavIds] = useState<string[]>([]);
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const loadFavorites = async () => {
    try {
      const r = await authedFetch("/api/favorites");
      if (!r.ok) return; // не залогинен — молча
      const data = (await r.json()) as string[];
      setFavIds(Array.isArray(data) ? data : []);
    } catch {
      // не критично
    }
  };

  const toggleFavorite = async (variantId: string) => {
    if (!variantId) return showToast("error", "Нет variant_id");

    const was = favSet.has(variantId);
    // оптимистично
    setFavIds((prev) => (was ? prev.filter((x) => x !== variantId) : [variantId, ...prev]));

    try {
      const r = await authedFetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!r.ok) {
        // откат
        setFavIds((prev) => (was ? [variantId, ...prev] : prev.filter((x) => x !== variantId)));
        return showToast("info", "Нужно войти в аккаунт");
      }

      const json = await r.json().catch(() => ({}));
      const active = Boolean((json as any)?.active);

      // синхронизация
      setFavIds((prev) => {
        const has = prev.includes(variantId);
        if (active && !has) return [variantId, ...prev];
        if (!active && has) return prev.filter((x) => x !== variantId);
        return prev;
      });

      showToast("success", active ? "Добавлено в избранное" : "Убрано из избранного");
    } catch {
      // откат
      setFavIds((prev) => (was ? [variantId, ...prev] : prev.filter((x) => x !== variantId)));
      showToast("error", "Ошибка сети");
    }
  };
  const addToCart = async (variantId: string) => {
    try {
      const res = await authedFetch("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      if (res.ok) return showToast("success", "Добавлено в корзину");
      showToast("info", "Нужно войти в аккаунт");
    } catch {
      showToast("error", "Ошибка сети");
    }
  };

  // ===== Banner slider =====
const slides: BannerSlide[] = useMemo(
  () => [
    {
      id: "s1",
      eyebrow: "SmartShop • Рассрочка",
      titleLines: ["РАССРОЧКА", "КРУГЛЫЙ ГОД"],
      subtitle: "Оформляйте 0-0-24 на популярные модели и покупайте комфортно.",
      primaryCta: { label: "Перейти в каталог", href: "/catalog" },
      secondaryCta: { label: "Посмотреть акции", href: "/promo" },
      gradient:
        "bg-[radial-gradient(1200px_600px_at_20%_80%,rgba(255,255,255,0.18),transparent_55%),linear-gradient(135deg,#0B6E52_0%,#0FAE7A_45%,#0A5A45_100%)]",
      glow: "from-emerald-300/40 via-white/10 to-transparent",
      accent: "emerald",
    },
    {
      id: "s2",
      eyebrow: "Смартфоны и аксессуары",
      titleLines: ["ТОП-НОВИНКИ", "УЖЕ В ПРОДАЖЕ"],
      subtitle: "Популярные модели, официальная гарантия, быстрая доставка.",
      primaryCta: { label: "Смартфоны", href: "/catalog?c=phones" },
      secondaryCta: { label: "Аксессуары", href: "/catalog?c=accessories" },
      gradient:
        "bg-[radial-gradient(900px_520px_at_15%_70%,rgba(255,255,255,0.16),transparent_60%),linear-gradient(135deg,#0A7A62_0%,#0D9B7A_40%,#064A3A_100%)]",
      glow: "from-emerald-200/35 via-white/10 to-transparent",
      accent: "sky",
    },
    {
      id: "s3",
      eyebrow: "Выгодно сегодня",
      titleLines: ["СКИДКИ", "И КЕШБЕК"],
      subtitle: "Ловите предложения недели и экономьте на покупке.",
      primaryCta: { label: "Все акции", href: "/promo" },
      secondaryCta: { label: "Каталог", href: "/catalog" },
      gradient:
        "bg-[radial-gradient(1000px_560px_at_25%_80%,rgba(255,255,255,0.16),transparent_55%),linear-gradient(135deg,#0B6A5B_0%,#10B981_40%,#0A4B3F_100%)]",
      glow: "from-amber-200/25 via-white/10 to-transparent",
      accent: "amber",
    },
  ],
  [],
);

  const [slideIndex, setSlideIndex] = useState(0);
  const sliderPausedRef = useRef(false);
  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = window.setInterval(() => {
      if (sliderPausedRef.current) return;
      setSlideIndex((x) => (x + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const slide = slides[slideIndex];

  // ===== Categories row =====
  const categories: Category[] = useMemo(
    () => [
      { id: "c1", title: "Денежное\nкредитование", href: "/catalog?c=credit", Icon: BadgePercent },
      { id: "c2", title: "Смартфоны", href: "/catalog", Icon: Phone },
      { id: "c3", title: "Смарт часы", href: "/catalog?c=watches", Icon: Watch },
      { id: "c4", title: "Наушники", href: "/catalog?c=audio", Icon: Headphones },
      { id: "c5", title: "Аксессуары\nдля гаджетов", href: "/catalog?c=accessories", Icon: Cable },
      { id: "c6", title: "Цифровые\nподписки", href: "/catalog?c=subscriptions", Icon: Grid2X2 },
      { id: "c7", title: "Подарочные\nсертификаты", href: "/catalog?c=gift", Icon: Gift },
      { id: "c8", title: "Бытовая\nтехника", href: "/catalog?c=home", Icon: WashingMachine },
      { id: "c9", title: "Красота\nи здоровье", href: "/catalog?c=beauty", Icon: Sparkles },
    ],
    [],
  );

  // ===== Load real variants =====
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("v_catalog_variants")
        .select(
          [
            "variant_id",
            "product_id",
            "brand",
            "product_name",
            "title",
            "description",
            "base_image_url",
            "color",
            "storage_gb",
            "memory_gb",
            "price_kzt",
            "sku",
            "image_url",
            "is_active",
            "product_is_active",
          ].join(","),
        )
        .eq("is_active", true)
        .eq("product_is_active", true)
        .order("price_kzt" as any, { ascending: false, nullsFirst: false })
        .limit(240);

      if (!alive) return;

      if (error) {
        setError(error.message);
        setVariants([]);
        setLoading(false);
        return;
      }

      const arr = (data ?? []) as CatalogVariant[];
      const cleaned = (arr as any[]).filter(
        (v) => !!safeId(v) && typeof v.price_kzt === "number" && (v.price_kzt ?? 0) > 0,
      );

      setVariants(cleaned);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [supabase]);

  // ===== Buckets =====
  const sortedAsc = useMemo(() => {
    const copy = [...(variants as any[])];
    copy.sort((a, b) => (a.price_kzt ?? 0) - (b.price_kzt ?? 0));
    return copy;
  }, [variants]);

  const sortedDesc = useMemo(() => {
    const copy = [...(variants as any[])];
    copy.sort((a, b) => (b.price_kzt ?? 0) - (a.price_kzt ?? 0));
    return copy;
  }, [variants]);

  const productOfMonth = sortedDesc[0] ?? null;

  // На широких экранах лучше 8, чем 6
  const budget = useMemo(() => sortedAsc.slice(0, 8), [sortedAsc]);
  const premium = useMemo(() => sortedDesc.slice(0, 8), [sortedDesc]);

  // "Популярные" (без popularity-поля): берем середину рынка и стабильно сортируем
  const popular = useMemo(() => {
    if (sortedAsc.length <= 16) return sortedDesc.slice(0, 8);

    const start = Math.floor(sortedAsc.length * 0.25);
    const end = Math.floor(sortedAsc.length * 0.75);
    const mid = sortedAsc.slice(start, end);

    const ranked = [...mid].sort((a, b) => {
      const ka = String(a.sku ?? safeId(a));
      const kb = String(b.sku ?? safeId(b));
      return ka.localeCompare(kb);
    });

    return ranked.slice(0, 8);
  }, [sortedAsc, sortedDesc]);
const pomVariantId = String((productOfMonth as any)?.variant_id ?? "");
const pomIsFav = favSet.has(pomVariantId);
  // "С повышенным кешбэком" — самые дорогие (как витрина)
  const cashbackBoost = useMemo(() => sortedDesc.slice(0, 8), [sortedDesc]);

  // ===== UI blocks =====
  const SectionShell = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-[32px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">{children}</div>
  );

    const ProductCard = ({ v }: { v: any }) => {
    const id = safeId(v);
    const price = Number(v.price_kzt ?? 0);
    const variantId = String(v?.variant_id ?? "");
    const isFav = favSet.has(variantId);

    return (
      <div className="rounded-[32px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
            0-0-24
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(variantId);
            }}
            className={[
              "grid h-10 w-10 place-items-center rounded-full transition",
              isFav ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-rose-500",
            ].join(" ")}
            aria-label={isFav ? "Убрать из избранного" : "В избранное"}
          >
            <Heart className={["h-5 w-5", isFav ? "fill-current" : "fill-current opacity-20"].join(" ")} />
          </button>
        </div>

        <Link href={`/product/${id}`} className="mt-5 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pickImage(v)}
            alt={v.title || "Товар"}
            className="mx-auto h-40 w-40 rounded-2xl bg-white object-contain p-2"
          />
        </Link>

        <div className="mt-5">
          <Link href={`/product/${id}`} className="line-clamp-2 text-[16px] font-black text-slate-900 hover:underline">
            {clampText(v.title ?? `${v.brand ?? ""} ${v.product_name ?? ""}`, 60)}
          </Link>

          <div className="mt-4 text-[26px] font-black text-slate-900">{formatPrice(price)}</div>

          <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-[12px] font-bold text-sky-700">
            {formatPrice(Math.round(price * 0.85))} <span className="text-slate-400">с учетом кешбэка</span>
          </div>

          <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-700">
            от {formatPrice(calcMonthly(price))} /мес × 24
          </div>

          <button
            onClick={() => addToCart(v.variant_id)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-[14px] font-black text-white hover:bg-emerald-700 active:scale-[0.99]"
          >
            <ShoppingCart className="h-5 w-5" />
            Купить
          </button>
        </div>
      </div>
    );
  };

  const ProductSection = ({
    title,
    items,
    rightLinkHref = "/catalog",
    rightLinkText = "Показать все",
  }: {
    title: string;
    items: any[];
    rightLinkHref?: string;
    rightLinkText?: string;
  }) => (
    <section className="mt-12">
      <SectionShell>
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900">{title}</h2>
            <Link href={rightLinkHref} className="text-[14px] font-bold text-emerald-700 hover:underline">
              {rightLinkText}
            </Link>
          </div>

          {loading ? (
            <div className="mt-10 flex items-center justify-center gap-2 text-[14px] font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Загрузка…
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-[14px] font-bold text-rose-700">
              Ошибка загрузки: {error}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-[14px] font-bold text-slate-600">
              Нет товаров для показа
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
              {items.map((v) => (
                <ProductCard key={safeId(v)} v={v} />
              ))}
            </div>
          )}
        </div>
      </SectionShell>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-900">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-gray-900 px-6 py-4 text-white shadow-2xl"
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="text-emerald-400" size={20} />
            ) : (
              <AlertTriangle className="text-rose-400" size={20} />
            )}
            <span className="text-sm font-bold">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT (max-w 1920) */}
      <main className="mx-auto max-w-[1920px] px-4 pb-14 pt-10 sm:px-8 lg:px-12 xl:px-16">
        {/* HERO (правую колонку расширили) */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px] lg:items-stretch">
          {/* Big banner */}
          {/* Big banner (UPDATED) */}
<div
  className="relative overflow-hidden rounded-[32px] p-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
  onMouseEnter={() => (sliderPausedRef.current = true)}
  onMouseLeave={() => (sliderPausedRef.current = false)}
>
  <div className={`relative h-full overflow-hidden rounded-[32px] ${slide.gradient}`}>
    {/* Decorative glow blobs */}
    <div className="pointer-events-none absolute inset-0 opacity-60">
      <div className={`absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br ${slide.glow} blur-3xl`} />
      <div className="absolute right-[-80px] top-[-60px] h-[420px] w-[420px] rounded-full bg-black/20 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[28%] h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
    </div>

    {/* Content grid */}
    <div className="relative grid h-[420px] grid-cols-1 gap-6 p-10 md:h-[480px] md:grid-cols-[1fr_400px] md:p-14">
      {/* LEFT */}
      <div className="flex flex-col justify-end text-white">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black tracking-wide ring-1 ring-white/15 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-white" />
          {slide.eyebrow}
        </div>

        {/* Animated slide text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight md:text-[64px] lg:text-[72px]">
              {slide.titleLines[0]}
              <br />
              {slide.titleLines[1]}
            </h1>

            <p className="mt-5 max-w-[660px] text-[15px] font-semibold text-white/85 md:text-[16px]">
              {slide.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={slide.primaryCta.href} legacyBehavior>
  <a
    className="inline-flex h-12 md:h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 md:px-8 text-[14px] md:text-[15px] font-black shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-1 ring-white/40 transition hover:bg-white/95 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] no-underline"
    style={{ color: "#064A3A", opacity: 1 }}
  >
    <span className="leading-none">{slide.primaryCta.label}</span>
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white">
      <ArrowRight className="h-4 w-4" />
    </span>
  </a>
</Link>

              <Link
                href={slide.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-7 py-3 text-[14px] font-black text-white ring-1 ring-white/15 backdrop-blur hover:bg-white/15 active:scale-[0.99]"
              >
                {slide.secondaryCta.label}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* RIGHT "calendar" */}
      <div className="hidden items-end justify-end md:flex">
        <div className="w-full">
          <div className="grid grid-cols-3 gap-4">
            {["Октябрь", "Ноябрь", "Декабрь", "Январь", "Февраль", "Март"].map((m) => (
              <div
                key={m}
                className="group grid aspect-square place-items-center rounded-3xl bg-white/10 text-sm font-black text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15"
              >
                <span className="opacity-90 transition group-hover:opacity-100">{m}</span>
              </div>
            ))}

            <div className="col-span-3 overflow-hidden rounded-3xl ring-1 ring-white/15">
              <div className="flex items-center justify-center bg-black/25 py-5 text-2xl font-black text-white backdrop-blur">
                0-0-24
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        type="button"
        className="absolute left-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-black/30 active:scale-[0.98]"
        aria-label="Назад"
        onClick={() => setSlideIndex((x) => (x - 1 + slides.length) % slides.length)}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        type="button"
        className="absolute right-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-black/30 active:scale-[0.98]"
        aria-label="Вперед"
        onClick={() => setSlideIndex((x) => (x + 1) % slides.length)}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Слайд ${i + 1}`}
            onClick={() => setSlideIndex(i)}
            className={[
              "h-2.5 rounded-full transition-all",
              i === slideIndex ? "w-10 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  </div>
</div>
          {/* Product of month */}
<SectionShell>
 <aside className="flex min-h-[420px] flex-col p-6 md:min-h-[480px] md:p-7">
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-black text-slate-900 md:text-[16px]">Товар месяца</h2>
      <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(pomVariantId);
  }}
  className={[
    "grid h-10 w-10 place-items-center rounded-full transition",
    pomIsFav ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-rose-500",
  ].join(" ")}
  aria-label={pomIsFav ? "Убрать из избранного" : "В избранное"}
>
  <Heart className={["h-5 w-5", pomIsFav ? "fill-current opacity-100" : "fill-current opacity-20"].join(" ")} />
</button>
    </div>

    {loading ? (
      <div className="mt-6 flex flex-1 flex-col">
        <div className="mx-auto mt-2 h-[210px] w-[210px] animate-pulse rounded-3xl bg-slate-100 md:h-[240px] md:w-[240px]" />

        <div className="mt-5 space-y-3">
          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="h-11 w-[220px] animate-pulse rounded-xl bg-slate-100" />
          <div className="h-11 w-14 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    ) : error ? (
      <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-[14px] font-bold text-rose-700">
        Ошибка загрузки: {error}
      </div>
    ) : !productOfMonth ? (
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-[14px] font-bold text-slate-600">
        Нет товаров для показа
      </div>
    ) : (
      <div className="mt-6 flex flex-1 flex-col">
        {/* Картинка (уменьшили, чтобы всегда помещалось) */}
        <div className="relative mx-auto mt-1">
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 text-[11px] font-extrabold text-white shadow-sm">
            0-0-24
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pickImage(productOfMonth)}
            alt={(productOfMonth as any).title ?? "Товар"}
            className="h-[210px] w-[210px] object-contain md:h-[240px] md:w-[240px]"
          />
        </div>

        {/* Инфа */}
        <div className="mt-5">
          <Link
            href={`/product/${safeId(productOfMonth)}`}
            className="line-clamp-2 text-[14px] font-black leading-snug text-slate-900 hover:underline md:text-[15px]"
          >
            {clampText((productOfMonth as any).title ?? "Товар", 68)}
          </Link>

          <div className="mt-3 text-[30px] font-black leading-none text-slate-900 md:text-[36px]">
            {formatPrice(Number((productOfMonth as any).price_kzt ?? 0))}
          </div>

          <div className="mt-2 text-[12px] font-bold text-sky-700 md:text-[13px]">
            {formatPrice(Math.round(Number((productOfMonth as any).price_kzt ?? 0) * 0.85))}{" "}
            <span className="text-slate-400">с учетом кешбека</span>
          </div>
        </div>

        {/* Низ всегда на месте */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-[12px] font-black text-emerald-700">
            от {formatPrice(calcMonthly(Number((productOfMonth as any).price_kzt ?? 0)))} /мес × 24
          </div>

          <button
            onClick={() => addToCart((productOfMonth as any).variant_id)}
            className="inline-flex h-11 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            aria-label="Добавить в корзину"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    )}
  </aside>
</SectionShell>
        </section>

        {/* Categories row */}
        <section className="mt-12">
          <SectionShell>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
                {categories.map((c) => (
                  <Link key={c.id} href={c.href} className="group rounded-[32px] bg-slate-50 p-5 transition hover:bg-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="grid h-16 w-16 place-items-center rounded-[28px] bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50">
                        <c.Icon className="h-8 w-8" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <div className="mt-5 whitespace-pre-line text-[13px] font-black leading-snug text-slate-800">
                      {c.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </SectionShell>
        </section>

        {/* Нижние секции */}
        <ProductSection title="Бюджетные смартфоны" items={budget} />
        <ProductSection title="Самые популярные" items={popular} />
        <ProductSection title="С повышенным кешбэком" items={cashbackBoost} rightLinkHref="/promo" rightLinkText="Все акции" />
        <ProductSection title="Премиум подборка" items={premium} />
      </main>
    </div>
  );
}