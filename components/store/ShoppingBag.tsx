"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store";

export default function ShoppingBag() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-candela-black/40 backdrop-blur-sm z-40"
          />

          {/* Bag panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
            style={{
              background: "rgba(255, 249, 245, 0.96)",
              backdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(244, 167, 185, 0.2)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-candela-pink/15">
              <div>
                <h2 className="font-display text-2xl text-candela-black font-medium tracking-wide">
                  Your Bag
                </h2>
                <p className="font-body text-xs text-candela-pink/70 tracking-widest uppercase mt-0.5">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeCart}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-candela-pink/10 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="text-4xl opacity-30">🛍️</div>
                  <p className="font-display text-xl text-candela-charcoal/60 font-light">
                    Your bag is empty
                  </p>
                  <p className="font-body text-sm text-candela-charcoal/40">
                    Discover something beautiful
                  </p>
                  <Link href="/shop" onClick={closeCart}>
                    <button className="mt-4 px-6 py-3 bg-candela-pink text-white font-body text-sm tracking-widest uppercase">
                      Shop Now
                    </button>
                  </Link>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-4 p-4 bg-white rounded-2xl border border-candela-pink/10 shadow-sm"
                      >
                        <div className="relative w-16 h-20 flex-shrink-0 bg-candela-cream rounded-xl overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.jpg"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-xs text-candela-pink tracking-widest uppercase mb-1">
                            {item.subcategory}
                          </p>
                          <h4 className="font-display text-base text-candela-black leading-tight line-clamp-2 mb-2">
                            {item.name}
                          </h4>
                          <div className="flex items-center justify-between">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-2 border border-candela-pink/20 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-candela-pink/10 transition-colors text-candela-charcoal"
                              >
                                −
                              </button>
                              <span className="font-body text-sm font-medium w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-candela-pink/10 transition-colors text-candela-charcoal"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-body font-medium text-candela-black">
                              {item.price * item.quantity} EGP
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1, color: "#E8728C" }}
                          onClick={() => removeItem(item.id)}
                          className="self-start text-candela-charcoal/30 hover:text-candela-pink transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-candela-pink/15 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-candela-charcoal/70 tracking-wide">Subtotal</span>
                  <span className="font-display text-xl text-candela-black font-medium">
                    {totalPrice()} EGP
                  </span>
                </div>
                <p className="font-body text-xs text-candela-charcoal/50 text-center">
                  Delivery will be confirmed with your order
                </p>
                <Link href="/order" onClick={closeCart}>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase shadow-lg hover:shadow-candela-product transition-shadow"
                    style={{ borderRadius: "12px" }}
                  >
                    Continue to Order
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
