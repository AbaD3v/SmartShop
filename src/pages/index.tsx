import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  },
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white selection:bg-black selection:text-white">
      {/* Linear-style subtle grid background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 pt-16 md:px-12 md:pt-24 lg:pt-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          
          {/* LEFT: Hero Content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-center lg:col-span-6 lg:pb-24"
          >
            <motion.div variants={item} className="mb-6 flex">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/70 bg-white/60 px-3 py-1.5 text-[13px] font-medium text-gray-600 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-md">
                <Sparkles size={14} className="text-gray-900" />
                <span className="tracking-wide">Премиальный маркетплейс</span>
              </div>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-gray-900 md:text-[64px] lg:text-[72px]"
            >
              SmartShop Store
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-[500px] text-[17px] leading-relaxed text-gray-500 md:text-[19px]"
            >
              Премиальный каталог смартфонов, проверка остатков по филиалам Астаны, удобный самовывоз и моментальное подтверждение.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link href="/catalog" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-14 w-full !rounded-[16px] bg-black px-8 text-[15px] font-medium text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
                  rightIcon={<ArrowRight size={18} className="opacity-70 transition-transform group-hover:translate-x-1" />}
                >
                  Открыть каталог
                </Button>
              </Link>
              <Link href="/branches" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-14 w-full !rounded-[16px] border border-gray-200/70 bg-white/80 px-8 text-[15px] font-medium text-gray-900 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-gray-50 sm:w-auto"
                >
                  Филиалы
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-12 flex flex-wrap items-center gap-6 text-[13px] font-medium text-gray-500"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-gray-400" />
                <span>Авторизация Supabase</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span>Самовывоз в Астане</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT: Trending Card / Stripe-like visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative lg:col-span-6 lg:pl-12"
          >
            {/* Ambient glows */}
            <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 opacity-50 blur-[80px]" />
            
            <div className="relative overflow-hidden rounded-[28px] border border-gray-200/60 bg-white/70 p-2 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              <div className="rounded-[20px] border border-gray-100/50 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900">Популярное сейчас</h3>
                    <p className="mt-1 text-[13px] text-gray-500">Доступно для самовывоза</p>
                  </div>
                  <div className="flex h-8 items-center rounded-full bg-gray-50 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Live
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  {[
                    { title: "iPhone 15 Pro", meta: "256 GB · Titanium", price: "от 549 990 ₸" },
                    { title: "Samsung S24 Ultra", meta: "512 GB · Black", price: "от 599 990 ₸" },
                    { title: "Pixel 8 Pro", meta: "256 GB · Bay", price: "от 429 990 ₸" },
                  ].map((p, i) => (
                    <div
                      key={p.title}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent p-3 transition-all hover:border-gray-200/70 hover:bg-gray-50/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gray-100/80 text-[13px] font-bold text-gray-400 transition-colors group-hover:bg-white group-hover:text-gray-900 group-hover:shadow-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-[15px] font-medium text-gray-900">{p.title}</p>
                          <p className="mt-0.5 text-[13px] text-gray-500">{p.meta}</p>
                        </div>
                      </div>
                      <p className="text-[15px] font-semibold text-gray-900">{p.price}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl bg-[#FAFAFA] p-5 border border-gray-100">
                  <p className="text-[13px] leading-relaxed text-gray-500">
                    В каталоге можно выбрать конфигурацию и сразу увидеть актуальную цену и наличие в магазинах.
                  </p>
                  <Link href="/catalog" className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-gray-900 hover:text-gray-600 transition-colors">
                    Перейти в каталог <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FEATURES SECTION (Linear style cards) */}
      <section className="relative z-10 mx-auto max-w-[1440px] px-6 py-24 md:px-12 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <p className="text-[13px] font-bold uppercase tracking-widest text-gray-400">Почему SmartShop</p>
            <h2 className="mt-3 text-[32px] font-semibold tracking-tight text-gray-900 md:text-[40px]">
              Быстро. Чисто. Удобно.
            </h2>
          </div>
          <div className="hidden md:block">
            <Link href="/catalog">
              <Button variant="secondary" className="h-10 !rounded-full text-[13px]" rightIcon={<ArrowRight size={14} />}>
                Смотреть все модели
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Проверка наличия",
              text: "Узнайте, в каком филиале смартфон доступен прямо сейчас без лишних звонков.",
              icon: <MapPin size={20} className="text-gray-900" />,
            },
            {
              title: "Самовывоз за 1 час",
              text: "Оформите заказ онлайн, и он будет готов к выдаче в удобное для вас время.",
              icon: <ArrowRight size={20} className="text-gray-900" />,
            },
            {
              title: "Мгновенное подтверждение",
              text: "Электронный чек и все детали заказа приходят на email сразу после оформления.",
              icon: <ShieldCheck size={20} className="text-gray-900" />,
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-[28px] border border-gray-200/70 bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-gray-100 bg-gray-50 shadow-sm transition-transform group-hover:scale-105">
                {feature.icon}
              </div>
              <h3 className="text-[19px] font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <Link href="/catalog" className="w-full">
            <Button variant="secondary" size="lg" className="w-full !rounded-[16px]" rightIcon={<ArrowRight size={16} />}>
              Смотреть все модели
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}