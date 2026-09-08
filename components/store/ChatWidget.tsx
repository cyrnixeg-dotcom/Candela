"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{
    id: string;
    content: string;
    fromOwner: boolean;
    createdAt: string;
  }[]>([]);
  const [input, setInput] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [stage, setStage] = useState<"intro" | "chat">("intro");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages when chat is open
  useEffect(() => {
    if (!customerId || !isOpen) return;
    const poll = setInterval(() => {
      fetch(`/api/chat?customerId=${customerId}`)
        .then((r) => r.json())
        .then(setMessages)
        .catch(console.error);
    }, 5000);
    return () => clearInterval(poll);
  }, [customerId, isOpen]);

  const startChat = async () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    setStage("chat");
    // Send welcome message
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerPhone,
        content: `Hi! I'm ${customerName}. I'd like to ask about your products.`,
        fromOwner: false,
      }),
    });
    const data = await res.json();
    setCustomerId(data.customerId);
    setMessages([data]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !customerId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, content, fromOwner: false }),
      });
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3 bg-candela-black text-white font-body text-sm tracking-widest uppercase shadow-lg"
            style={{
              borderRadius: "100px",
              boxShadow: "0 8px 32px rgba(244,167,185,0.3)",
            }}
          >
            <span className="text-lg">💬</span>
            <span className="hidden sm:block">Chat with Candela</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col overflow-hidden"
            style={{
              height: "520px",
              borderRadius: "24px",
              background: "rgba(255,249,245,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(244,167,185,0.2)",
              boxShadow: "0 24px 80px rgba(244,167,185,0.3), 0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            {/* Chat header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-candela-pink flex items-center justify-center text-white text-sm font-bold">C</div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-candela-black" />
                </div>
                <div>
                  <p className="font-display text-white text-base font-medium">Candela</p>
                  <p className="font-body text-white/50 text-xs">Usually replies within hours</p>
                </div>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </div>

            {/* Intro stage */}
            {stage === "intro" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-6 gap-4"
              >
                <div className="text-4xl mb-2">🌸</div>
                <p className="font-display text-xl text-candela-black text-center">
                  Welcome to Candela
                </p>
                <p className="font-body text-sm text-candela-charcoal/60 text-center">
                  Ask us about fragrances, orders, or products. We're here to help!
                </p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-candela"
                />
                <input
                  type="tel"
                  placeholder="Your phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input-candela"
                  onKeyDown={(e) => e.key === "Enter" && startChat()}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startChat}
                  disabled={!customerName.trim() || !customerPhone.trim()}
                  className="w-full py-3 bg-candela-black text-white font-body text-sm tracking-widest uppercase disabled:opacity-40"
                  style={{ borderRadius: "12px" }}
                >
                  Start Chat
                </motion.button>
              </motion.div>
            )}

            {/* Chat messages */}
            {stage === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex justify-center">
                    <span className="font-body text-xs text-candela-charcoal/40 bg-candela-pink/10 px-3 py-1 rounded-full">
                      Your conversation is now live ✨
                    </span>
                  </div>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromOwner ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={msg.fromOwner ? "chat-bubble-customer" : "chat-bubble-owner"}
                      >
                        <p className="font-body text-sm leading-relaxed">{msg.content}</p>
                        <p className="font-body text-[10px] opacity-50 mt-1 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString("en-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="px-4 py-3 border-t border-candela-pink/15 flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 bg-candela-pink-light/50 border border-candela-pink/20 rounded-xl font-body text-sm text-candela-black placeholder-candela-charcoal/40 focus:outline-none focus:border-candela-pink"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="w-9 h-9 bg-candela-black rounded-xl flex items-center justify-center text-white disabled:opacity-40"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
