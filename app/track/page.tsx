"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Navigation from "@/components/store/Navigation";
import { getStatusLabel, getStatusColor } from "@/lib/utils";

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  address: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image: string; subcategory: string };
  }[];
}

const STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const STATUS_ICONS: Record<string, string> = {
  PENDING: "⏳",
  CONFIRMED: "✅",
  PREPARING: "🎀",
  OUT_FOR_DELIVERY: "🚗",
  DELIVERED: "🌸",
  CANCELLED: "❌",
};

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Order not found");
        return;
      }
      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex =
    order?.status === "CANCELLED"
      ? -1
      : STATUS_STEPS.indexOf(order?.status || "");

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <div className="fixed inset-0 bg-hero-gradient opacity-40 pointer-events-none" />

      <div className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="font-script text-candela-pink-deep text-3xl mb-2">follow your order</p>
            <h1 className="font-display text-6xl font-light text-candela-black tracking-wider">TRACK</h1>
          </motion.div>

          {/* Lookup form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm border border-candela-pink/10 p-8 space-y-5 mb-8"
            style={{ borderRadius: "24px", boxShadow: "0 8px 40px rgba(244,167,185,0.1)" }}
          >
            <div>
              <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. CND-ABC123-XY01"
                className="input-candela"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <div>
              <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone used when ordering"
                className="input-candela"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTrack}
              disabled={loading || !orderNumber.trim() || !phone.trim()}
              className="w-full py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase disabled:opacity-40"
              style={{ borderRadius: "12px" }}
            >
              {loading ? "Searching..." : "Track My Order"}
            </motion.button>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-body text-sm text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          {/* Order result */}
          <AnimatePresence>
            {order && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Status card */}
                <div
                  className="bg-white/90 backdrop-blur-sm border border-candela-pink/10 p-8"
                  style={{ borderRadius: "24px", boxShadow: "0 8px 40px rgba(244,167,185,0.12)" }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-body text-xs text-candela-charcoal/50 tracking-widest uppercase mb-1">Order Number</p>
                      <p className="font-body font-medium text-candela-black">{order.orderNumber}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-body font-medium border ${getStatusColor(order.status)}`}>
                      {STATUS_ICONS[order.status]} {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Progress timeline */}
                  {order.status !== "CANCELLED" ? (
                    <div className="relative">
                      <div className="flex justify-between items-start">
                        {STATUS_STEPS.map((s, i) => (
                          <div key={s} className="flex flex-col items-center gap-2 flex-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                                i <= currentStepIndex
                                  ? "bg-candela-black text-white"
                                  : "bg-candela-pink/10 text-candela-charcoal/30"
                              }`}
                            >
                              {i < currentStepIndex ? "✓" : STATUS_ICONS[s]}
                            </div>
                            <p className={`font-body text-[9px] text-center tracking-wide uppercase leading-tight ${
                              i <= currentStepIndex ? "text-candela-black" : "text-candela-charcoal/30"
                            }`}>
                              {getStatusLabel(s).replace(" ", "\n")}
                            </p>
                            {/* Connector line */}
                            {i < STATUS_STEPS.length - 1 && (
                              <div
                                className="absolute top-4 h-px transition-all duration-500"
                                style={{
                                  left: `calc(${(100 / STATUS_STEPS.length) * (i + 0.5)}%)`,
                                  width: `calc(${100 / STATUS_STEPS.length}%)`,
                                  background:
                                    i < currentStepIndex
                                      ? "#1A1A1A"
                                      : "rgba(244,167,185,0.2)",
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="font-body text-red-500">This order has been cancelled.</p>
                    </div>
                  )}
                </div>

                {/* Order items */}
                <div
                  className="bg-white/90 backdrop-blur-sm border border-candela-pink/10 p-6"
                  style={{ borderRadius: "24px" }}
                >
                  <h3 className="font-display text-xl text-candela-black mb-5">Your Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-12 h-14 relative flex-shrink-0 bg-candela-cream rounded-lg overflow-hidden">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.jpg"; }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-body text-sm font-medium text-candela-black">{item.product.name}</p>
                          <p className="font-body text-xs text-candela-charcoal/50">× {item.quantity}</p>
                        </div>
                        <p className="font-body text-sm font-medium">{item.price * item.quantity} EGP</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-candela-pink/10 flex justify-between">
                      <span className="font-body text-sm text-candela-charcoal/60">Total</span>
                      <span className="font-display text-xl font-medium">{order.total} EGP</span>
                    </div>
                  </div>
                </div>

                {/* Delivery address */}
                <div
                  className="bg-white/90 backdrop-blur-sm border border-candela-pink/10 p-6"
                  style={{ borderRadius: "24px" }}
                >
                  <h3 className="font-display text-xl text-candela-black mb-4">Delivery Info</h3>
                  <p className="font-body text-sm text-candela-charcoal/70">{order.customer.name}</p>
                  <p className="font-body text-sm text-candela-charcoal/60">{order.address}, {order.city}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
