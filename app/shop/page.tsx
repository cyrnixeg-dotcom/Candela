"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Navigation from "@/components/store/Navigation";
import FloatingProduct from "@/components/store/FloatingProduct";
import ShoppingBag from "@/components/store/ShoppingBag";
import ChatWidget from "@/components/store/ChatWidget";

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

const CATEGORIES = [
  { key: "all", label: "All Products" },
  { key: "body-beauty", label: "Body & Beauty" },
  { key: "candles", label: "Candles" },
  { key: "home-car", label: "Home & Car" },
];

const SUBCATEGORIES: Record<string, string[]> = {
  "body-beauty": ["Body Mist", "Perfume Oil", "Body Serum", "Body Lotion", "Makhmaria", "Highlighter", "Gift Set"],
  candles: ["Massage Candle", "Vangokh Candle Jar", "Candle Jar", "Candle Cakes"],
  "home-car": ["Car Diffuser", "Home Diffuser", "Air Freshener"],
};

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcat, setActiveSubcat] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showInStock, setShowInStock] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const searchParams = useSearchParams();

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) setActiveCategory(catParam);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...products];
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (activeSubcat) {
      result = result.filter((p) => p.subcategory === activeSubcat);
    }
    if (showInStock) {
      result = result.filter((p) => p.inStock);
    }
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    if (sortBy === "featured") {
      result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFiltered(result);
  }, [products, activeCategory, activeSubcat, priceRange, showInStock, sortBy]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubcat("");
  };

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />

      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center bg-gradient-to-b from-candela-pink-pale to-candela-cream">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-script text-candela-pink-deep text-3xl mb-2">discover</p>
          <h1 className="font-display text-6xl md:text-8xl font-light text-candela-black tracking-wider mb-4">
            THE COLLECTION
          </h1>
          <p className="font-body text-candela-charcoal/60 text-sm tracking-widest uppercase">
            {filtered.length} products
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCategoryChange(cat.key)}
              className={`px-6 py-2.5 font-body text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                activeCategory === cat.key
                  ? "bg-candela-black text-white"
                  : "border border-candela-pink/30 text-candela-charcoal hover:border-candela-black"
              }`}
              style={{ borderRadius: "100px" }}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Subcategory + filters row */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {activeCategory !== "all" &&
            SUBCATEGORIES[activeCategory]?.map((sub) => (
              <motion.button
                key={sub}
                whileHover={{ scale: 1.02 }}
                onClick={() =>
                  setActiveSubcat(activeSubcat === sub ? "" : sub)
                }
                className={`px-4 py-1.5 font-body text-xs tracking-wider uppercase transition-all duration-200 ${
                  activeSubcat === sub
                    ? "bg-candela-pink text-white"
                    : "bg-candela-pink/10 text-candela-charcoal hover:bg-candela-pink/20"
                }`}
                style={{ borderRadius: "100px" }}
              >
                {sub}
              </motion.button>
            ))}

          <div className="flex items-center gap-3 ml-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-candela-pink/20 bg-white font-body text-xs text-candela-charcoal rounded-xl focus:outline-none focus:border-candela-pink"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInStock}
                onChange={(e) => setShowInStock(e.target.checked)}
                className="accent-pink-400"
              />
              <span className="font-body text-xs text-candela-charcoal tracking-wide">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] skeleton rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-3xl text-candela-charcoal/40 mb-4">No products found</p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setActiveSubcat("");
              }}
              className="font-body text-sm text-candela-pink underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8"
            >
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <FloatingProduct product={product} index={i} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
