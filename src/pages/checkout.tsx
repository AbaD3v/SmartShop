import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Branch } from "@/lib/types";
import { authedFetch } from "@/lib/authedFetch";
import type { Session } from "@supabase/supabase-js";
import { motion, Variants } from "framer-motion";
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ArrowLeft,
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
  }
};

export default function CheckoutPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

useEffect(() => {
  const initCheckout = async () => {
    const supabase = getSupabaseBrowser();

    try {
      // 1. Проверяем сессию
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        // Если юзера нет, уходим на логин и прерываем выполнение
        await router.replace("/auth?next=/checkout");
        return;
      }

      // Если мы здесь — юзер на месте
      setEmail(user.email || "");

      // 2. Параллельно или последовательно грузим филиалы
      const res = await fetch("/api/branches");
      if (!res.ok) throw new Error("Failed to fetch branches");
      
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error("Checkout init error:", error);
      setBranches([]);
    }
  };

  initCheckout();
}, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return alert("Пожалуйста, выберите филиал для самовывоза.");

    setSubmitting(true);
    try {
      const res = await authedFetch("/api/orders/create", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          customerEmail: email,
          customerName: name || null,
          customerPhone: phone || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "Ошибка при создании заказа");
        return;
      }
      
      router.push(`/account/${data.orderId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFBFD] pb-20 pt-10">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-[1000px] px-4"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <Link 
            href="/cart" 
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Вернуться в корзину
          </Link>
          <h1 className="mt-4 text-[32px] font-semibold tracking-tight text-gray-900">
            Оформление заказа
          </h1>
        </motion.div>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-12">
          {/* Левая колонка: Данные */}
          <div className="space-y-6 lg:col-span-7">
            <motion.section variants={itemVariants} className="rounded-[24px] border border-gray-200/60 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <User size={20} />
                </div>
                <h2 className="text-xl font-semibold">Контактные данные</h2>
              </div>
              
              <div className="grid gap-4">
                <Input
                  label="Электронная почта"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  leftIcon={<Mail size={18} className="text-gray-400" />}
                  className="!rounded-2xl"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван"
                    leftIcon={<User size={18} className="text-gray-400" />}
                    className="!rounded-2xl"
                  />
                  <Input
                    label="Телефон"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (777) 000-00-00"
                    leftIcon={<Phone size={18} className="text-gray-400" />}
                    className="!rounded-2xl"
                  />
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="rounded-[24px] border border-gray-200/60 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <MapPin size={20} />
                </div>
                <h2 className="text-xl font-semibold">Филиал самовывоза</h2>
              </div>

              <div className="grid gap-3">
                {branches.map((branch) => (
                  <label
                    key={branch.id}
                    className={`relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border-2 p-4 transition-all hover:bg-gray-50 ${
                      branchId === branch.id 
                        ? "border-blue-600 bg-blue-50/30" 
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                        branchId === branch.id ? "border-blue-600 bg-blue-600" : "border-gray-300"
                      }`}>
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
                        <p className="font-semibold text-gray-900">{branch.name}</p>
                        <p className="text-sm text-gray-500">{branch.address}</p>
                      </div>
                    </div>
                    {branchId === branch.id && (
                      <motion.div layoutId="check" className="text-blue-600">
                        <CheckCircle2 size={20} />
                      </motion.div>
                    )}
                  </label>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Правая колонка: Итог */}
          <div className="lg:col-span-5">
            <motion.div 
              variants={itemVariants} 
              className="sticky top-24 rounded-[24px] border border-gray-200/60 bg-white p-6 shadow-lg md:p-8"
            >
              <h2 className="mb-6 text-xl font-semibold">Итог заказа</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-500">
                  <span>Доставка</span>
                  <span className="font-medium text-gray-900">Самовывоз (Бесплатно)</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Подтверждение придет на ваш Email
                </div>
              </div>

              <Button
                type="submit"
                onClick={submit}
                disabled={submitting || !branchId}
                className="mt-8 h-14 w-full !rounded-2xl bg-black text-lg font-medium text-white transition-all hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Оформляем...
                  </div>
                ) : (
                  "Подтвердить заказ"
                )}
              </Button>
              
              <p className="mt-4 text-center text-[12px] text-gray-400">
                Нажимая кнопку, вы соглашаетесь с условиями <br /> публичной оферты и обработки данных.
              </p>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </main>
  );
}