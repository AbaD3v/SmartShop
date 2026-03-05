// src/pages/checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Branch } from "@/lib/types";
import { authedFetch } from "@/lib/authedFetch";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

type CartItemLite = {
  variant_id: string;
  title: string;
  quantity: number;
  price_kzt: number;
  image_url?: string | null;
  color?: string | null;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function safeCartItems(json: any): CartItemLite[] {
  const items = (json?.items ?? json?.cart?.items ?? []) as any[];
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      variant_id: String(it.variant_id ?? ""),
      title: String(it.title ?? "Товар"),
      quantity: Number(it.quantity ?? 0),
      price_kzt: Number(it.price_kzt ?? 0),
      image_url: it.image_url ?? null,
      color: it.color ?? null,
    }))
    .filter((x) => x.variant_id && x.quantity > 0);
}

export default function CheckoutPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [cartItems, setCartItems] = useState<CartItemLite[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3000);
  };

  // ===== Init: session + branches + cart =====
  useEffect(() => {
    let isMounted = true;

    const initCheckout = async () => {
      const supabase = getSupabaseBrowser();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (!session?.user) {
          await router.replace("/auth?next=/checkout");
          return;
        }

        setEmail(session.user.email || "");

        // Load branches
        const br = await fetch("/api/branches");
        const brJson = await br.json().catch(() => []);
        if (isMounted) setBranches(Array.isArray(brJson) ? brJson : []);

        // Load cart
        setCartLoading(true);
        const cr = await authedFetch("/api/cart");
        if (cr.status === 401) {
          // user exists in supabase, but token missing in authedFetch (rare). Send to auth.
          showToast("info", "Нужно войти в аккаунт");
          await router.replace("/auth?next=/checkout");
          return;
        }
        const crJson = await cr.json().catch(() => ({}));
        const items = safeCartItems(crJson);
        if (isMounted) setCartItems(items);
      } catch (error) {
        // Don't spam console in prod — keep it quiet.
        if (isMounted) {
          setBranches([]);
          setCartItems([]);
        }
      } finally {
        if (isMounted) setCartLoading(false);
      }
    };

    initCheckout();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const total = useMemo(
    () => cartItems.reduce((sum, it) => sum + it.quantity * it.price_kzt, 0),
    [cartItems],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!branchId) {
      showToast("info", "Выберите филиал для самовывоза");
      return;
    }

    if (cartItems.length === 0) {
      showToast("info", "Корзина пустая");
      router.push("/cart");
      return;
    }

    setSubmitting(true);

    try {
      const res = await authedFetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          customerEmail: email,
          customerName: name || null,
          customerPhone: phone || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        showToast("info", "Нужно войти в аккаунт");
        router.push("/auth?next=/checkout");
        return;
      }

      if (res.status === 409 && data?.error === "NOT_ENOUGH_INVENTORY") {
        showToast("error", data?.message || "Недостаточно товара на складе");
        return;
      }

      if (!res.ok) {
        showToast("error", data?.error || "Ошибка при создании заказа");
        return;
      }

      showToast("success", "Заказ оформлен!");
      router.push(`/account/orders/${data.orderId}`);
    } catch {
      showToast("error", "Произошла ошибка при отправке заказа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f7] pb-20 pt-10 text-slate-900">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-2xl"
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="text-emerald-400" size={20} />
            ) : toast.kind === "info" ? (
              <AlertTriangle className="text-sky-300" size={20} />
            ) : (
              <AlertTriangle className="text-rose-400" size={20} />
            )}
            <span className="text-sm font-black">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12"
      >
        <motion.div variants={itemVariants} className="mb-10">
          <Link
            href="/cart"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Вернуться в корзину
          </Link>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-[64px]">
            Оформление заказа
          </h1>
          <p className="mt-3 text-[15px] font-semibold text-slate-500">
            Самовывоз • Подтверждение придёт на email
          </p>
        </motion.div>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-12">
          {/* LEFT */}
          <div className="space-y-6 lg:col-span-8">
            {/* Contact */}
            <motion.section
              variants={itemVariants}
              className="rounded-[32px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 md:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Контактные данные</h2>
                  <p className="text-sm font-semibold text-slate-400">
                    Для чека и статуса заказа
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                <Input
                  label="Электронная почта"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  leftIcon={<Mail size={18} className="text-slate-400" />}
                  className="!rounded-[22px]"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Куанышбек"
                    leftIcon={<User size={18} className="text-slate-400" />}
                    className="!rounded-[22px]"
                  />
                  <Input
                    label="Телефон"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (777) 000-00-00"
                    leftIcon={<Phone size={18} className="text-slate-400" />}
                    className="!rounded-[22px]"
                  />
                </div>
              </div>
            </motion.section>

            {/* Branches */}
            <motion.section
              variants={itemVariants}
              className="rounded-[32px] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 md:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Филиал самовывоза</h2>
                  <p className="text-sm font-semibold text-slate-400">
                    Выберите удобную точку
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {branches.map((branch) => (
                  <label
                    key={branch.id}
                    className={[
                      "relative flex cursor-pointer items-start justify-between gap-4 overflow-hidden rounded-[22px] border p-5 transition-all",
                      "hover:border-emerald-200 hover:bg-slate-50",
                      branchId === branch.id
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-100 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          branchId === branch.id
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-slate-300 bg-white",
                        ].join(" ")}
                      >
                        {branchId === branch.id && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>

                      <input
                        type="radio"
                        className="sr-only"
                        name="branch"
                        checked={branchId === branch.id}
                        onChange={() => setBranchId(branch.id)}
                        required
                      />

                      <div>
                        <p className="font-black leading-tight text-slate-900">{branch.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {branch.address}
                        </p>
                      </div>
                    </div>

                    {branchId === branch.id && (
                      <motion.div layoutId="check" className="shrink-0 text-emerald-600">
                        <CheckCircle2 size={22} />
                      </motion.div>
                    )}
                  </label>
                ))}
              </div>
            </motion.section>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-4">
            <motion.div
              variants={itemVariants}
              className="sticky top-24 rounded-[32px] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/5 md:p-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Итог заказа</h2>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200/50">
                  <CreditCard size={14} />
                  Самовывоз
                </div>
              </div>

              {/* Cart preview */}
              <div className="mt-6">
                {cartLoading ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                    <Loader2 className="animate-spin text-emerald-500" size={18} />
                    Загружаем корзину…
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="rounded-[22px] bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    Корзина пустая.{" "}
                    <Link href="/catalog" className="text-emerald-700 hover:underline">
                      Перейти в каталог
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.slice(0, 5).map((it) => (
                      <div
                        key={it.variant_id}
                        className="flex items-center gap-3 rounded-[22px] bg-slate-50 p-3 ring-1 ring-black/5"
                      >
                        <div className="h-14 w-14 overflow-hidden rounded-[18px] bg-white ring-1 ring-black/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.image_url || "https://placehold.co/200x200?text=SmartShop"}
                            alt={it.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-black text-slate-900">
                            {it.title}
                          </div>
                          <div className="mt-0.5 text-[12px] font-semibold text-slate-500">
                            {it.color ? `${it.color} • ` : ""}
                            {it.quantity} шт.
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[13px] font-black text-slate-900">
                            {formatPrice(it.price_kzt)}
                          </div>
                          <div className="text-[11px] font-bold text-slate-500">
                            x{it.quantity}
                          </div>
                        </div>
                      </div>
                    ))}

                    {cartItems.length > 5 && (
                      <div className="text-[12px] font-bold text-slate-500">
                        + ещё {cartItems.length - 5} товаров
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-3 rounded-[22px] bg-white p-4 ring-1 ring-black/5">
                <div className="flex justify-between text-[14px] font-semibold text-slate-500">
                  <span>Товары</span>
                  <span className="font-black text-slate-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-[14px] font-semibold text-slate-500">
                  <span>Доставка</span>
                  <span className="font-black text-emerald-600">Бесплатно</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-end justify-between">
                  <span className="text-[13px] font-black uppercase tracking-wider text-slate-400">
                    Итого
                  </span>
                  <span className="text-[36px] font-black leading-none tracking-tight tabular-nums text-slate-900">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] font-bold text-slate-500">
                  от {formatPrice(Math.max(1, Math.round(total / 24)))} /мес × 24
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                Номер заказа и чек придут на Email
              </div>

              <Button
                type="submit"
                disabled={submitting || !branchId || cartLoading || cartItems.length === 0}
                className="mt-7 h-14 w-full !rounded-[22px] bg-slate-900 text-[15px] font-black text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Оформляем…
                  </div>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <ShoppingBag size={18} />
                    Подтвердить заказ
                  </span>
                )}
              </Button>

              <p className="mt-4 text-center text-[12px] font-semibold leading-normal text-slate-400">
                Нажимая кнопку, вы соглашаетесь с условиями{" "}
                <span className="underline cursor-pointer">публичной оферты</span> и обработки данных.
              </p>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </main>
  );
}