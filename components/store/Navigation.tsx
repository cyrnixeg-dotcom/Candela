"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, useUIStore, useSettingsStore } from "@/store";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Body & Beauty", href: "/shop?category=body-beauty" },
  { label: "Candles", href: "/shop?category=candles" },
  { label: "Home & Car", href: "/shop?category=home-car" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const openSearch = useUIStore((s) => s.openSearch);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => { 
    setMounted(true);
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass border-b border-white/40 shadow-sm py-3"
            : "bg-transparent py-5"
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/images/logo.jpg"
              alt={settings.store_name || "CANDELA"}
              width={40}
              height={40}
              className="rounded-full group-hover:scale-110 transition-transform duration-300"
            />
            <span className="font-display text-2xl font-light tracking-[0.2em] text-candela-black hidden sm:block">
              {settings.store_name || "CANDELA"}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-xs tracking-[0.15em] uppercase text-candela-charcoal hover:text-candela-pink transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={openSearch}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-candela-pink/10 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </motion.button>

            {/* Admin Quick Switch Pill */}
            {mounted && session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full font-body text-[11px] font-bold tracking-wider uppercase transition-colors"
                title="Go to Candela Admin Dashboard"
              >
                <span>⚙️</span>
                Admin
              </Link>
            )}

            {/* Account / Orders Profile Icon */}
            <Link
              href={session ? "/account" : "/login?callbackUrl=/account"}
              title={session ? `Account: ${session.user?.name || session.user?.email}` : "Sign In / View Orders"}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-candela-pink/10 transition-colors text-candela-charcoal hover:text-candela-pink-deep"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {mounted && session && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </motion.div>
            </Link>

            {/* Cart bag */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleCart}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-candela-pink/10 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <AnimatePresence>
                {mounted && totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-candela-pink text-white text-[10px] font-medium rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }}
                className="w-5 h-px bg-candela-black block origin-center transition-all"
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1 }}
                className="w-5 h-px bg-candela-black block"
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }}
                className="w-5 h-px bg-candela-black block origin-center transition-all"
              />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 glass-pink flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
              <Image
                src="/images/logo.jpg"
                alt="CANDELA"
                width={80}
                height={80}
                className="rounded-full mb-4"
              />
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    className="font-display text-3xl font-light text-candela-black hover:text-candela-pink transition-colors duration-200 tracking-wider"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.06 }}
              >
                <Link
                  href={session ? "/account" : "/login?callbackUrl=/account"}
                  className="font-display text-3xl font-light text-candela-pink-deep hover:text-candela-black transition-colors duration-200 tracking-wider"
                  onClick={() => setMenuOpen(false)}
                >
                  {session ? "My Account & Orders" : "Sign In / Register"}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinks.length + 1) * 0.06 }}
              >
                <Link
                  href="/track"
                  className="font-display text-2xl font-light text-candela-charcoal/70 hover:text-candela-pink transition-colors duration-200 tracking-wider"
                  onClick={() => setMenuOpen(false)}
                >
                  Track Order
                </Link>
              </motion.div>

              {session?.user?.role === "ADMIN" && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 2) * 0.06 }}
                >
                  <Link
                    href="/admin"
                    className="font-display text-2xl font-light text-purple-600 hover:text-purple-800 transition-colors duration-200 tracking-wider flex items-center gap-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>⚙️</span>
                    Admin Dashboard
                  </Link>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <a href="tel:+201000000000">
                  <button className="px-8 py-3 bg-candela-black text-white font-body text-sm tracking-widest uppercase">
                    📞 Call Candela
                  </button>
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <SearchOverlay />
    </>
  );
}

function SearchOverlay() {
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; subcategory: string; price: number; image: string }[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-candela-black/90 backdrop-blur-md flex flex-col items-center pt-24 px-6"
          onClick={(e) => e.target === e.currentTarget && closeSearch()}
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            onClick={closeSearch}
            className="absolute top-6 right-6 text-white/70 hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-xl"
          >
            <p className="font-script text-candela-pink text-2xl text-center mb-6">Search</p>
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, fragrances..."
                className="w-full px-6 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-body text-lg placeholder-white/40 focus:outline-none focus:border-candela-pink/60 focus:ring-2 focus:ring-candela-pink/20"
              />
            </div>

            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-2"
              >
                {results.slice(0, 6).map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} onClick={closeSearch}>
                    <div className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                      <Image
                        src={product.image || "/candela-logo.png"}
                        alt={product.name}
                        width={44}
                        height={44}
                        unoptimized
                        className="rounded-lg object-cover bg-white/10"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/candela-logo.png"; }}
                      />
                      <div>
                        <p className="font-body text-white text-sm">{product.name}</p>
                        <p className="font-body text-white/50 text-xs">{product.subcategory} · {product.price} EGP</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
