"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navigation from "@/components/store/Navigation";
import ShoppingBag from "@/components/store/ShoppingBag";
import { useCartStore, useSettingsStore } from "@/store";
import { GOVERNORATES } from "@/lib/utils";

type Step = "contact" | "delivery" | "review" | "success";

interface OrderData {
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  notes: string;
}

interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (session?.user && (session.user as any).role !== "ADMIN") {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user?.name || "",
      }));
    }
  }, [session]);
  const { items, totalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("contact");
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [formData, setFormData] = useState<OrderData>({
    customerName: "",
    customerPhone: "",
    address: "",
    city: "",
    notes: "",
  });

  useEffect(() => {
    if (items.length === 0 && step !== "success") {
      router.push("/shop");
    }
  }, [items, step, router]);

  const update = (field: keyof OrderData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const submitOrder = async () => {
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          address: formData.address,
          city: formData.city,
          notes: formData.notes,
          items: orderItems,
        }),
      });

      if (!res.ok) throw new Error("Order failed");
      const order = await res.json();
      setCreatedOrder(order);
      clearCart();
      setStep("success");
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const steps: Step[] = ["contact", "delivery", "review"];
  const stepIndex = steps.indexOf(step);

  if (step === "success" && createdOrder) {
    return <OrderSuccess order={createdOrder} />;
  }

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-hero-gradient opacity-40" />

      <div className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="font-script text-candela-pink-deep text-3xl mb-2">place your order</p>
            <h1 className="font-display text-5xl font-light text-candela-black tracking-wider">
              ORDER DETAILS
            </h1>
          </motion.div>

          {/* Step indicators */}
          {step !== "success" && (
            <div className="flex items-center justify-center gap-3 mb-12">
              {["Contact", "Delivery", "Review"].map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-body text-xs font-medium transition-all duration-300 ${
                      i <= stepIndex
                        ? "bg-candela-black text-white"
                        : "border border-candela-pink/30 text-candela-charcoal/40"
                    }`}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span
                    className={`font-body text-xs tracking-widest uppercase ${
                      i === stepIndex ? "text-candela-black" : "text-candela-charcoal/40"
                    }`}
                  >
                    {label}
                  </span>
                  {i < 2 && (
                    <div className={`w-8 h-px ${i < stepIndex ? "bg-candela-black" : "bg-candela-pink/20"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form card */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm border border-candela-pink/10 p-8"
            style={{ borderRadius: "24px", boxShadow: "0 8px 40px rgba(244,167,185,0.1)" }}
          >
            <AnimatePresence mode="wait">
              {step === "contact" && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display text-2xl text-candela-black mb-6">Contact Information</h2>
                  <div>
                    <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={update("customerName")}
                      placeholder="Your full name"
                      className="input-candela"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={update("customerPhone")}
                      placeholder="e.g. 01xxxxxxxxx"
                      className="input-candela"
                    />
                    <p className="font-body text-xs text-candela-charcoal/40 mt-2">
                      We'll use this to confirm your order
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep("delivery")}
                    disabled={!formData.customerName || !formData.customerPhone}
                    className="w-full py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase disabled:opacity-40"
                    style={{ borderRadius: "12px" }}
                  >
                    Next: Delivery →
                  </motion.button>
                </motion.div>
              )}

              {step === "delivery" && (
                <motion.div
                  key="delivery"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display text-2xl text-candela-black mb-6">Delivery Information</h2>
                  <div>
                    <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={update("address")}
                      placeholder="Street name, building, apartment..."
                      className="input-candela"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                      City / Governorate *
                    </label>
                    <select
                      value={formData.city}
                      onChange={update("city")}
                      className="input-candela"
                    >
                      <option value="">Select your city</option>
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">
                      Order Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={update("notes")}
                      placeholder="Any special requests or notes..."
                      rows={3}
                      className="input-candela resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("contact")}
                      className="flex-1 py-4 border border-candela-pink/30 text-candela-charcoal font-body text-sm tracking-widest uppercase hover:border-candela-black transition-colors"
                      style={{ borderRadius: "12px" }}
                    >
                      ← Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep("review")}
                      disabled={!formData.address || !formData.city}
                      className="flex-1 py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase disabled:opacity-40"
                      style={{ borderRadius: "12px" }}
                    >
                      Review Order →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="font-display text-2xl text-candela-black">Order Summary</h2>

                  {/* Items */}
                  <div className="space-y-3 border-b border-candela-pink/10 pb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-14 h-16 relative flex-shrink-0 bg-candela-cream rounded-lg overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.jpg"; }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-body text-sm text-candela-black font-medium">{item.name}</p>
                          <p className="font-body text-xs text-candela-charcoal/50">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-body text-sm font-medium">{item.price * item.quantity} EGP</p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-2">
                    <span className="font-body text-candela-charcoal/70">Total</span>
                    <span className="font-display text-2xl text-candela-black font-medium">
                      {totalPrice()} EGP
                    </span>
                  </div>

                  {/* Delivery info */}
                  <div className="bg-candela-pink-light/50 rounded-2xl p-5 space-y-2">
                    <p className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase mb-3">Delivery to</p>
                    <p className="font-body text-sm text-candela-black font-medium">{formData.customerName}</p>
                    <p className="font-body text-sm text-candela-charcoal/70">{formData.customerPhone}</p>
                    <p className="font-body text-sm text-candela-charcoal/70">{formData.address}, {formData.city}</p>
                    {formData.notes && (
                      <p className="font-body text-sm text-candela-charcoal/50 italic">"{formData.notes}"</p>
                    )}
                  </div>

                  {/* No payment notice */}
                  <div className="bg-candela-gold/10 border border-candela-gold/20 rounded-xl p-4">
                    <p className="font-body text-xs text-candela-charcoal/70 leading-relaxed">
                      🌸 <strong>No online payment required.</strong> Candela will contact you to confirm your order and arrange delivery. Orders are usually confirmed within 24 hours.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("delivery")}
                      className="flex-1 py-4 border border-candela-pink/30 text-candela-charcoal font-body text-sm tracking-widest uppercase hover:border-candela-black transition-colors"
                      style={{ borderRadius: "12px" }}
                    >
                      ← Edit
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={submitOrder}
                      disabled={loading}
                      className="flex-1 py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase disabled:opacity-60"
                      style={{ borderRadius: "12px", boxShadow: "0 8px 32px rgba(244,167,185,0.2)" }}
                    >
                      {loading ? "Placing Order..." : "Confirm Order ✓"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function OrderSuccess({ order }: { order: CreatedOrder }) {
  const settings = useSettingsStore((s) => s.settings);
  return (
    <main className="min-h-screen bg-candela-cream flex items-center justify-center">
      <div className="fixed inset-0 bg-hero-gradient opacity-60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 text-center px-8 max-w-lg mx-auto"
      >
        {/* Animated flower */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.3, type: "spring" }}
          className="text-6xl mb-6"
        >
          🌸
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-display text-5xl font-light text-candela-black mb-4 tracking-wider"
        >
          Order Received!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="font-body text-candela-charcoal/70 leading-relaxed mb-8"
        >
          {settings.delivery_note || "Your order has been received. We'll contact you to confirm your order and delivery details."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 backdrop-blur-sm border border-candela-pink/20 rounded-2xl p-6 mb-8 text-left space-y-3"
          style={{ boxShadow: "0 8px 40px rgba(244,167,185,0.15)" }}
        >
          <div className="flex justify-between">
            <span className="font-body text-xs text-candela-charcoal/50 tracking-widest uppercase">Order Number</span>
            <span className="font-body text-sm font-medium text-candela-black">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-candela-charcoal/50 tracking-widest uppercase">Total</span>
            <span className="font-body text-sm font-medium">{order.total} EGP</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-candela-charcoal/50 tracking-widest uppercase">Status</span>
            <span className="font-body text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Pending Confirmation
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          <p className="font-body text-xs text-candela-charcoal/50">
            Keep your order number to track your order status
          </p>
          <div className="flex gap-3 justify-center">
            <a href={`/track`}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="px-6 py-3 bg-candela-black text-white font-body text-sm tracking-widest uppercase"
                style={{ borderRadius: "12px" }}
              >
                Track Order
              </motion.button>
            </a>
            <a href="/shop">
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="px-6 py-3 border border-candela-pink text-candela-pink font-body text-sm tracking-widest uppercase"
                style={{ borderRadius: "12px" }}
              >
                Continue Shopping
              </motion.button>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
