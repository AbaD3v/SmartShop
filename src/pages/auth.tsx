// src/pages/auth.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles,
  X,
  Mail,
  Lock,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

const SectionShell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-[32px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 ${className}`}
  >
    {children}
  </div>
);

export default function AuthPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const title = mode === "login" ? "Вход" : "Регистрация";
  const subtitle = useMemo(() => {
    return mode === "login"
      ? "Войдите, чтобы добавлять товары в корзину и оформлять заказы."
      : "Создайте аккаунт — это займёт меньше минуты.";
  }, [mode]);

  const showToast = (kind: ToastKind, text: string) => {
    setToast({ kind, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  };

  const nextUrl = useMemo(() => {
    const q = typeof router.query.next === "string" ? router.query.next : "";
    return q || "/";
  }, [router.query.next]);

  useEffect(() => {
    (async () => {
      const { data }: { data: { session: Session | null } } = await supabase.auth.getSession();
      if (data?.session) router.replace(nextUrl || "/");
    })();

    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      showToast("info", "Введите email и пароль.");
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        showToast("success", "Аккаунт создан. Если нужно — подтверди email и войди.");
        setMode("login");
        setPassword("");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        router.push(nextUrl || "/");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : "Ошибка авторизации";

      const normalized = msg.toLowerCase();
      if (normalized.includes("invalid") || normalized.includes("credentials")) {
        showToast("error", "Неверный email или пароль.");
      } else {
        showToast("error", msg || "Ошибка авторизации");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setToast(null);
    setPassword("");
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-900">
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
            ) : toast.kind === "error" ? (
              <AlertTriangle className="text-rose-400" size={20} />
            ) : (
              <Info className="text-sky-300" size={20} />
            )}
            <span className="text-sm font-bold">{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 grid h-8 w-8 place-items-center rounded-xl bg-white/10 hover:bg-white/15"
              aria-label="Закрыть"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1680px] px-4 pb-20 pt-10 sm:px-8 lg:px-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[14px] font-black text-gray-700 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <ArrowLeft size={18} />
            На главную
          </Link>

          <span className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-black text-slate-600 ring-1 ring-black/5 md:inline-flex">
            <ShieldCheck size={14} className="text-emerald-600" />
            Supabase Auth · JWT Bearer
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left / Brand */}
          <SectionShell className="relative overflow-hidden lg:col-span-7">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-300/40 via-white/10 to-transparent blur-3xl" />
              <div className="absolute right-[-90px] top-[-60px] h-[420px] w-[420px] rounded-full bg-black/5 blur-3xl" />
              <div className="absolute bottom-[-140px] left-[20%] h-[540px] w-[540px] rounded-full bg-emerald-200/15 blur-3xl" />
            </div>

            <div className="relative p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[12px] font-black text-emerald-700 ring-1 ring-emerald-200/60">
                <Sparkles size={14} />
                SmartShop
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[0.95] tracking-tight text-slate-900 md:text-[52px]">
                Премиальный
                <br />
                опыт покупки
              </h1>

              <p className="mt-5 max-w-xl text-[15px] font-bold leading-relaxed text-slate-500">
                Вход нужен для корзины, самовывоза и истории заказов. После оформления — чек
                приходит на email.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  { t: "Корзина и заказы", d: "История покупок и быстрый повтор." },
                  { t: "Чек на email", d: "Квитанция и детали сразу после заказа." },
                  { t: "Самовывоз", d: "Выбираете филиал — и забираете удобно." },
                  { t: "Безопасно", d: "Supabase Auth + JWT Bearer." },
                ].map((x) => (
                  <div key={x.t} className="rounded-[24px] bg-white p-5 ring-1 ring-black/5">
                    <p className="text-[14px] font-black text-slate-900">{x.t}</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-500">{x.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-[24px] bg-slate-50 p-5 ring-1 ring-black/5">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Подсказка
                </div>
                <div className="mt-2 text-[14px] font-bold text-slate-600">
                  Если тебя перебросило сюда из оформления заказа — после входа вернём обратно.
                </div>
              </div>
            </div>
          </SectionShell>

          {/* Right / Auth card */}
          <SectionShell className="lg:col-span-5">
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {title}
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}
                </h2>
                <p className="mt-3 text-[14px] font-bold text-slate-500">{subtitle}</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                  leftIcon={<Mail size={18} className="text-slate-400" />}
                  className="!rounded-[22px]"
                />

                <Input
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  leftIcon={<Lock size={18} className="text-slate-400" />}
                  className="!rounded-[22px]"
                />

                {/* Кнопка как в твоём дизайне */}
                <Button
                  className="h-14 w-full !rounded-[22px] bg-emerald-600 text-[15px] font-black text-white hover:bg-emerald-700"
                  loading={loading}
                  onClick={handleSubmit}
                >
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </Button>

                <button
                  type="button"
                  onClick={switchMode}
                  className="w-full rounded-[22px] bg-slate-50 py-4 text-[14px] font-black text-slate-700 ring-1 ring-black/5 hover:bg-slate-100"
                >
                  {mode === "login" ? "Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
              </div>

              <p className="mt-6 text-center text-[12px] font-bold text-slate-400">
                Нажимая кнопку, вы соглашаетесь с обработкой данных для оформления заказов.
              </p>
            </div>
          </SectionShell>
        </div>
      </main>
    </div>
  );
}