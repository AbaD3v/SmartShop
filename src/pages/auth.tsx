// src/pages/auth.tsx
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

type ToastKind = "success" | "error" | "info";

export default function AuthPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const title = mode === "login" ? "Вход" : "Регистрация";
  const subtitle = useMemo(() => {
    return mode === "login"
      ? "Войдите, чтобы добавлять товары в корзину и оформлять заказы."
      : "Создайте аккаунт — это займёт меньше минуты.";
  }, [mode]);

  const showToast = (kind: ToastKind, text: string) => setToast({ kind, text });

  useEffect(() => {
    // Если уже есть сессия — уводим на главную.
    // TypeScript ругался на implicit any из-за destructuring ({ data })
    // Решение: типизируем результат и не даём any появиться.
    (async () => {
      const { data }: { data: { session: Session | null } } = await supabase.auth.getSession();
      if (data?.session) router.replace("/");
    })();
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

        // Supabase может требовать подтверждения email — UX: нейтральное сообщение
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

        router.push("/");
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
    <main className="container-shell py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
          >
            <ArrowLeft size={16} className="text-gray-600" />
            На главную
          </Link>

          <span className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs text-gray-600 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur md:inline-flex">
            <ShieldCheck size={14} className="text-gray-700" />
            Supabase Auth · JWT Bearer
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: brand panel */}
          <section className="relative overflow-hidden rounded-[28px] border border-gray-200/70 bg-white shadow-sm lg:col-span-7">
            <div className="pointer-events-none absolute -top-40 right-[-160px] h-[420px] w-[420px] rounded-full bg-slate-200/55 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-52 left-[-180px] h-[520px] w-[520px] rounded-full bg-gray-100/80 blur-3xl" />

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgb(17 24 39) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />

            <div className="relative p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs text-gray-600 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur">
                <Sparkles size={14} className="text-gray-700" />
                SmartShop Store
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
                Премиальный опыт покупки
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
                Войдите, чтобы сохранять корзину, оформлять самовывоз и получать чек на email.
                Всё — в минималистичном стиле, как в Apple Store.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  { t: "Корзина и заказы", d: "История заказов и быстрый повтор покупок." },
                  { t: "Подтверждение на email", d: "Чек и детали приходят сразу после заказа." },
                  { t: "Самовывоз в Астане", d: "Выбираете филиал — и забираете удобно." },
                  { t: "Безопасно", d: "Supabase Auth + JWT Bearer." },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                  >
                    <p className="text-sm font-medium text-gray-900">{x.t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right: auth card */}
          <section className="lg:col-span-5">
            <div className="card-surface p-7 md:p-8">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                  {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{subtitle}</p>
              </div>

              {toast ? (
                <div
                  className={[
                    "mb-5 flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                    toast.kind === "success" ? "border-emerald-200" : "",
                    toast.kind === "error" ? "border-rose-200" : "",
                    toast.kind === "info" ? "border-gray-200" : "",
                  ].join(" ")}
                  role="status"
                >
                  <span className="mt-0.5">
                    {toast.kind === "success" ? (
                      <CheckCircle2 size={18} className="text-emerald-600" />
                    ) : toast.kind === "error" ? (
                      <AlertTriangle size={18} className="text-rose-600" />
                    ) : (
                      <Info size={18} className="text-gray-700" />
                    )}
                  </span>
                  <div className="flex-1 text-gray-800">{toast.text}</div>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
                    aria-label="Закрыть"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : null}

              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

                <Input
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />

                <Button className="w-full" size="lg" loading={loading} onClick={handleSubmit}>
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </Button>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
                <button
                  className="font-medium text-slate-900 hover:underline"
                  onClick={switchMode}
                  type="button"
                >
                  {mode === "login" ? "Зарегистрироваться" : "Войти"}
                </button>
              </div>

              <p className="mt-5 text-xs text-gray-500">
                Нажимая кнопку, вы соглашаетесь с обработкой данных для оформления заказов.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}