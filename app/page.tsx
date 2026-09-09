"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/store/Navigation";
import FloatingProduct from "@/components/store/FloatingProduct";
import ShoppingBag from "@/components/store/ShoppingBag";
import ChatWidget from "@/components/store/ChatWidget";
import ParticleField from "@/components/store/ParticleField";
import { useSettingsStore } from "@/store";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  description: string;
  isFeatured: boolean;
  inStock: boolean;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, -60]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const bodyBeautyProducts = products.filter((p) => p.category === "body-beauty");
  const candleProducts = products.filter((p) => p.category === "candles");
  const homeCarProducts = products.filter((p) => p.category === "home-car");

  return (
    <main className="bg-candela-cream overflow-x-hidden">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />

      {/* ===== HERO SCENE — no overflow-hidden so floaters bleed into next section ===== */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center z-20"
        id="hero"
      >
        {/* Real background image */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/backgrounds/bg-2.png"
            alt="Candela Background"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,167,185,0.4),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(201,169,110,0.3),transparent_60%)]" />
        </div>

        {/* Particle field */}
        <ParticleField />        {/* Floating hero items — visible and animated on both mobile and desktop */}
        {isLoaded && [
          { src: "/images/hero-floaters/floater-1.png", left: "3%",  top: "15%", speed: 1.1 },
          { src: "/images/hero-floaters/floater-2.png", left: "77%", top: "12%", speed: 0.8 },
          { src: "/images/hero-floaters/floater-3.png", left: "2%",  top: "56%", speed: 1.4 },
          { src: "/images/hero-floaters/floater-4.png", left: "78%", top: "58%", speed: 0.9 },
          { src: "/images/hero-floaters/floater-5.png", left: "10%", top: "84%", speed: 1.0 },
          { src: "/images/hero-floaters/floater-6.png", left: "72%", top: "82%", speed: 1.2 },
        ].map((item, i) => (
          <HeroFloater key={i} item={item} mouseX={smoothMouseX} mouseY={smoothMouseY} speed={item.speed} />
        ))}

        {/* Hero text — z-10 sits above floaters */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto pt-16 sm:pt-0">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center mb-5 sm:mb-8"
          >
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full shadow-candela-glow animate-pulse-soft overflow-hidden">
              <Image
                src="/images/logo.jpg"
                alt="CANDELA"
                fill
                priority
                className="object-cover"
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl sm:text-7xl md:text-9xl font-light text-candela-black tracking-wider mb-2 sm:mb-4"
          >
            CANDELA
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="font-script text-3xl sm:text-4xl md:text-5xl text-candela-pink-deep mb-8 sm:mb-10"
          >
            your feminine scent
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center relative z-30 pointer-events-auto w-full max-w-xs sm:max-w-none mx-auto"
          >
            <Link href="/shop" className="w-full sm:w-auto relative z-30 cursor-pointer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-candela-pink text-candela-black font-body text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase hover:bg-candela-pink-deep hover:text-white transition-all duration-300 shadow-candela-glow cursor-pointer rounded-full"
              >
                Shop Collection
              </motion.button>
            </Link>
            <Link href="/order" className="w-full sm:w-auto relative z-30 cursor-pointer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 border border-candela-pink-deep text-candela-pink-deep font-body text-xs sm:text-sm tracking-[0.25em] uppercase hover:bg-candela-pink-deep hover:text-white transition-all duration-300 cursor-pointer rounded-full"
              >
                Quick Order
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="font-body text-xs tracking-[0.3em] text-candela-pink/70 uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-candela-pink to-transparent" />
        </motion.div>
      </motion.section>

      {/* The section below has z-10 + a mask so it gracefully fades over the floaters */}
      {/* ===== SCENE 2: BODY & BEAUTY ===== */}
      <CategoryScene
        category="body-beauty"
        title="Body & Beauty"
        subtitle="Your daily ritual of luxury"
        products={bodyBeautyProducts}
        bgImage="/images/backgrounds/bg-3.png"
      />

      {/* ===== SCENE 3: CANDLES ===== */}
      <CategoryScene
        category="candles"
        title="Candles"
        subtitle="Illuminate your world"
        products={candleProducts}
        bgImage="/images/backgrounds/bg-4.png"
        warmTone
      />

      {/* ===== SCENE 4: HOME & CAR ===== */}
      <CategoryScene
        category="home-car"
        title="Home & Car"
        subtitle="Fill every space with fragrance"
        products={homeCarProducts}
        bgImage="/images/backgrounds/bg-5.png"
      />

      {/* ===== FULL SHOP CTA ===== */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/backgrounds/bg-6.png" alt="Shop All" fill className="object-cover" />
          <div className="absolute inset-0 bg-candela-black/50" />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-script text-candela-pink text-3xl mb-4">the full collection</p>
            <h2 className="font-display text-5xl md:text-7xl font-light text-white mb-8 tracking-wider">
              EXPLORE ALL
            </h2>
            <Link href="/shop">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#F4A7B9", color: "#1A1A1A" }}
                className="shine px-12 py-5 border border-candela-pink text-candela-pink font-body font-medium tracking-[0.3em] text-sm uppercase transition-all duration-500"
              >
                Shop Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== ABOUT STRIP ===== */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/backgrounds/bg-7.png" alt="About Candela" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-candela-cream/80" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <p className="font-script text-candela-pink-deep text-3xl mb-4">about candela</p>
          <p className="font-body text-candela-charcoal/70 text-lg leading-relaxed">
            CANDELA is a premium feminine fragrance and lifestyle brand crafted for the woman who celebrates herself every day. From luxurious body mists to artisan candles, every product is a sensory experience designed to make you feel extraordinary.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {["Body & Beauty", "Candles", "Home & Car"].map((cat) => (
              <div key={cat} className="text-center">
                <div className="w-1 h-8 bg-candela-pink mx-auto mb-3" />
                <p className="font-body text-xs tracking-[0.2em] uppercase text-candela-black">{cat}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact / Call Strip */}
      <section className="py-12 bg-candela-pink-light border-t border-candela-pink/20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl text-candela-black">Have a question?</p>
            <p className="font-body text-sm text-candela-charcoal/60 mt-1">We&apos;d love to hear from you.</p>
          </div>
          <div className="flex gap-4">
            <a href={`tel:${(settings?.phone || "+201000000000").replace(/\s+/g, '')}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 bg-candela-black text-white font-body text-sm tracking-widest uppercase cursor-pointer"
              >
                📞 Call {settings.store_name || "Candela"}
              </motion.button>
            </a>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-6 py-3 border border-candela-black text-candela-black font-body text-sm tracking-widest uppercase"
              >
                Chat with Us
              </motion.button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Category scene component ──────────────────────────────────────────────
function CategoryScene({
  category,
  title,
  subtitle,
  products,
  bgImage,
  warmTone = false,
}: {
  category: string;
  title: string;
  subtitle: string;
  products: Product[];
  bgImage: string;
  warmTone?: boolean;
}) {
  return (
    <section
      className="relative py-28 overflow-hidden z-10 pointer-events-none"
      style={{ marginTop: "-60px" }}
    >
      {/* Background fades in from transparent (masking hero blend) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)",
        }}
      >
        <Image src={bgImage} alt={title} fill className="object-cover opacity-70 pointer-events-none" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[8px] pointer-events-none" />
        {warmTone && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,169,110,0.12),transparent_70%)] pointer-events-none" />}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pointer-events-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="font-script text-candela-pink-deep text-3xl mb-2">{subtitle}</p>
          <h2 className="font-display text-6xl md:text-8xl font-light text-candela-black tracking-wider mb-6">
            {title.toUpperCase()}
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-candela-pink/40" />
            <div className="w-2 h-2 rounded-full bg-candela-pink" />
            <div className="h-px w-16 bg-candela-pink/40" />
          </div>
        </motion.div>

        {/* Product grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {products.slice(0, 8).map((product, i) => (
              <FloatingProduct key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-body text-candela-charcoal/40 text-sm tracking-widest uppercase">
              Coming soon...
            </p>
          </div>
        )}

        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link href={`/shop?category=${category}`} className="inline-block cursor-pointer">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-10 py-3 border border-candela-black text-candela-black font-body text-sm tracking-[0.2em] uppercase hover:bg-candela-black hover:text-white transition-all duration-300 cursor-pointer"
              >
                View All {title}
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ─── Hero Floater ──────────────────────────────────────────────────────────
function HeroFloater({ item, mouseX, mouseY, speed }: { item: any; mouseX: any; mouseY: any; speed: number }) {
  const x = useTransform(mouseX, [0, 1], [-10 * speed, 10 * speed]);
  const y = useTransform(mouseY, [0, 1], [-10 * speed, 10 * speed]);
  return (
    <motion.div
      className="absolute pointer-events-none select-none z-0"
      style={{ left: item.left, top: item.top, x, y }}
    >
      <motion.div
        animate={{
          y: [0, -12 * speed, 0],
          rotate: [0, 2 * speed, -2 * speed, 0],
        }}
        transition={{
          duration: 3.5 + speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative pointer-events-none w-20 h-28 sm:w-28 sm:h-36 md:w-36 md:h-48 lg:w-44 lg:h-56"
      >
        <Image
          src={item.src}
          alt="Candela Floater"
          fill
          sizes="(max-width: 640px) 90px, (max-width: 768px) 120px, 180px"
          className="object-contain drop-shadow-xl pointer-events-none opacity-85 sm:opacity-95"
          priority
        />
      </motion.div>
    </motion.div>
  );
}
