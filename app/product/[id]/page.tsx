"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/store/Navigation";
import ShoppingBag from "@/components/store/ShoppingBag";
import ChatWidget from "@/components/store/ChatWidget";
import { useCartStore } from "@/store";

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

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orderMode, setOrderMode] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddToBag = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        subcategory: product.subcategory,
      });
    }
  };

  const handleOrderNow = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        subcategory: product.subcategory,
      });
    }
    router.push("/order");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-candela-cream flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-candela-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-candela-cream flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-3xl text-candela-charcoal/50">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />

      {/* Cinematic background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-hero-gradient opacity-50" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, rgba(244,167,185,0.4), transparent 60%)`,
          }}
        />
      </div>

      <div className="relative z-10 pt-24 pb-20 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 font-body text-xs text-candela-charcoal/60 tracking-widest uppercase mb-16 hover:text-candela-pink transition-colors"
          >
            ← Back
          </motion.button>

          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Product image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex justify-center"
            >
              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative rounded-[32px] overflow-hidden border-[4px] border-white/60 shadow-[0_30px_60px_rgba(244,167,185,0.4)]"
                style={{ width: "100%", maxWidth: "500px", aspectRatio: "4/3" }}
              >
                <Image
                  src={(product.image || "/images/logo.jpg").replace(/\.jpg$/, ".png")}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-1000 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/logo.jpg";
                  }}
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Category badge */}
              <div className="flex items-center gap-3">
                <span className="font-body text-xs text-candela-pink tracking-[0.3em] uppercase">
                  {product.subcategory}
                </span>
                {product.isFeatured && (
                  <span className="px-3 py-1 bg-candela-gold/20 text-candela-gold text-xs font-body tracking-wider rounded-full">
                    ✦ Featured
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="font-display text-5xl md:text-6xl font-light text-candela-black leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="font-display text-4xl text-candela-black font-medium">
                  {product.price}
                </span>
                <span className="font-body text-lg text-candela-charcoal/60">EGP</span>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-candela-pink/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-candela-pink" />
                <div className="h-px flex-1 bg-candela-pink/20" />
              </div>

              {/* Description */}
              <p className="font-body text-candela-charcoal/70 leading-relaxed text-base">
                {product.description}
              </p>

              {/* Availability */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body ${
                product.inStock
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`} />
                {product.inStock ? "In Stock — Ready to order" : "Currently Out of Stock"}
              </div>

              {/* Quantity */}
              {product.inStock && (
                <div className="flex items-center gap-4">
                  <span className="font-body text-sm text-candela-charcoal/60 tracking-widest uppercase">Qty</span>
                  <div className="flex items-center border border-candela-pink/30 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-candela-pink/10 transition-colors text-xl"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-body font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-candela-pink/10 transition-colors text-xl"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-body text-sm text-candela-charcoal/60">
                    = {product.price * quantity} EGP
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {product.inStock ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOrderNow}
                      className="flex-1 py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase shadow-lg hover:shadow-candela-product transition-shadow"
                      style={{ borderRadius: "12px" }}
                    >
                      Order This Product
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToBag}
                      className="flex-1 py-4 border border-candela-black text-candela-black font-body font-medium tracking-[0.2em] text-sm uppercase hover:bg-candela-pink hover:border-candela-pink hover:text-white transition-all duration-300"
                      style={{ borderRadius: "12px" }}
                    >
                      Add to Bag
                    </motion.button>
                  </>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-4 bg-candela-charcoal/20 text-candela-charcoal/40 font-body font-medium tracking-[0.2em] text-sm uppercase cursor-not-allowed"
                    style={{ borderRadius: "12px" }}
                  >
                    Currently Unavailable
                  </button>
                )}
              </div>

              {/* Reassurance */}
              <div className="pt-4 border-t border-candela-pink/10 space-y-2">
                {[
                  "🌸 Authentic Candela products",
                  "📦 We'll contact you to confirm delivery",
                  "💬 Chat with us for any questions",
                ].map((text) => (
                  <p key={text} className="font-body text-xs text-candela-charcoal/50">
                    {text}
                  </p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
