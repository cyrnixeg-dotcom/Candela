"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/store/Navigation";
import ShoppingBag from "@/components/store/ShoppingBag";
import ChatWidget from "@/components/store/ChatWidget";
import { useSettingsStore } from "@/store";

export default function ContactPage() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          content: message,
          fromOwner: false,
        }),
      });
      setSent(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />
      <div className="fixed inset-0 bg-hero-gradient opacity-40 pointer-events-none" />

      <div className="relative z-10 pt-28 pb-24 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <p className="font-script text-candela-pink-deep text-3xl mb-2">get in touch</p>
            <h1 className="font-display text-6xl font-light text-candela-black tracking-wider">CONTACT</h1>
          </motion.div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="text-5xl mb-4">🌸</div>
              <h2 className="font-display text-3xl text-candela-black mb-3">Message Sent!</h2>
              <p className="font-body text-candela-charcoal/60">
                We'll get back to you as soon as possible.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="bg-white/80 backdrop-blur-sm border border-candela-pink/10 p-8 space-y-5"
              style={{ borderRadius: "24px", boxShadow: "0 8px 40px rgba(244,167,185,0.1)" }}
            >
              <div>
                <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">Your Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="input-candela" />
              </div>
              <div>
                <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" required className="input-candela" />
              </div>
              <div>
                <label className="font-body text-xs text-candela-charcoal/60 tracking-widest uppercase block mb-2">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" required rows={5} className="input-candela resize-none" />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={sending}
                className="w-full py-4 bg-candela-black text-white font-body font-medium tracking-[0.2em] text-sm uppercase disabled:opacity-50"
                style={{ borderRadius: "12px" }}
              >
                {sending ? "Sending..." : "Send Message"}
              </motion.button>
            </motion.form>
          )}

          {/* Contact methods */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 text-center">
            <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="flex-1 py-4 border border-candela-pink/20 hover:border-candela-pink transition-colors" style={{ borderRadius: "12px" }}>
              <p className="font-body text-xs text-candela-charcoal/50 tracking-widest uppercase mb-1">Call Us</p>
              <p className="font-display text-lg text-candela-black">{settings.phone}</p>
            </a>
            <a 
              href={`https://instagram.com/${settings.instagram.replace('@', '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 py-4 border border-candela-pink/20 hover:border-candela-pink transition-colors" 
              style={{ borderRadius: "12px" }}
            >
              <p className="font-body text-xs text-candela-charcoal/50 tracking-widest uppercase mb-1">Instagram</p>
              <p className="font-display text-lg text-candela-black">{settings.instagram}</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
