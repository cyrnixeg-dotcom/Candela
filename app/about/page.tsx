"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/store/Navigation";
import ShoppingBag from "@/components/store/ShoppingBag";
import ChatWidget from "@/components/store/ChatWidget";
import { useSettingsStore } from "@/store";

export default function AboutPage() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />

      <div className="fixed inset-0 bg-hero-gradient opacity-40 pointer-events-none" />

      <div className="relative z-10 pt-28 pb-24">
        {/* Hero */}
        <section className="text-center px-6 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/images/logo.jpg"
              alt={settings.store_name || "CANDELA"}
              width={120}
              height={120}
              className="rounded-full mx-auto mb-8 shadow-candela-glow animate-pulse-soft"
            />
            <p className="font-script text-candela-pink-deep text-4xl mb-4">about us</p>
            <h1 className="font-display text-7xl md:text-9xl font-light text-candela-black tracking-wider mb-8">
              {settings.store_name || "CANDELA"}
            </h1>
            <p className="font-body text-candela-charcoal/60 max-w-xl mx-auto leading-relaxed text-lg">
              {settings.about || "A premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day."}
            </p>
          </motion.div>
        </section>

        {/* Story */}
        <section className="max-w-3xl mx-auto px-6 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-16 bg-candela-pink/40" />
              <p className="font-script text-candela-pink text-2xl">our story</p>
              <div className="h-px w-16 bg-candela-pink/40" />
            </div>
            <p className="font-body text-candela-charcoal/70 leading-relaxed text-lg mb-6">
              CANDELA was born from a deep love of fragrance and a belief that every woman deserves to feel extraordinary in her everyday life. From luxurious body mists that leave a shimmering trail, to artisan candles that transform any space — every product is a sensory experience.
            </p>
            <p className="font-body text-candela-charcoal/70 leading-relaxed text-lg">
              Each Candela product is crafted with care, using the finest ingredients to deliver a scent experience that is both memorable and personal. We believe fragrance is more than a product — it's a feeling, a memory, an identity.
            </p>
          </motion.div>
        </section>

        {/* Values */}
        <section className="bg-candela-black py-24 px-6 mb-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="font-script text-candela-pink text-3xl mb-3">what we stand for</p>
              <h2 className="font-display text-5xl font-light text-white tracking-wider">OUR VALUES</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: "🌸", title: "Femininity", desc: "Celebrating the beauty and power of womanhood in every product we create." },
                { icon: "✨", title: "Quality", desc: "Only the finest ingredients, crafted with care and attention to detail." },
                { icon: "💖", title: "Personal", desc: "Every Candela product is a personal experience — made for you, by us." },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-8"
                  style={{ background: "rgba(255,255,255,0.04)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-4xl mb-4">{v.icon}</div>
                  <h3 className="font-display text-2xl text-white mb-3">{v.title}</h3>
                  <p className="font-body text-white/50 text-sm leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-script text-candela-pink-deep text-3xl mb-4">ready to explore?</p>
            <Link href="/shop">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-12 py-5 bg-candela-black text-white font-body font-medium tracking-[0.3em] text-sm uppercase shadow-lg hover:shadow-candela-product transition-shadow"
              >
                Shop the Collection
              </motion.button>
            </Link>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
