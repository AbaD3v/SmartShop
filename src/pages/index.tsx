// src/pages/index.tsx
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="container-shell py-20">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-gray-50 p-10 md:p-16">
        
        {/* Soft background glow */}
        <div className="pointer-events-none absolute -top-32 right-[-120px] h-[300px] w-[300px] rounded-full bg-slate-200/40 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <p className="mb-4 text-sm uppercase tracking-wide text-gray-400">
            Новый уровень покупки смартфонов
          </p>

          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-gray-900 md:text-6xl">
            SmartShop Store
          </h1>

          <p className="max-w-2xl text-base text-gray-600 md:text-lg">
            Премиальный каталог смартфонов, проверка остатков по филиалам
            Астаны, удобный самовывоз и моментальное подтверждение заказа.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/catalog">
              <Button size="lg" rightIcon={<ArrowRight size={16} />}>
                Открыть каталог
              </Button>
            </Link>

            <Link href="/branches">
              <Button variant="secondary" size="lg">
                Филиалы
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Secondary section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-24 grid gap-10 md:grid-cols-3"
      >
        {[
          {
            title: "Проверка наличия",
            text: "Узнайте, в каком филиале смартфон доступен прямо сейчас.",
          },
          {
            title: "Самовывоз за 1 час",
            text: "Оформите заказ онлайн и заберите в удобное время.",
          },
          {
            title: "Мгновенное подтверждение",
            text: "Чек и детали заказа приходят на email сразу после оформления.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="card-surface p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600">{feature.text}</p>
          </div>
        ))}
      </motion.section>
    </main>
  );
}