"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playNotificationSound } from "@/lib/audio";

interface ChatMessage {
  id: string;
  content: string;
  fromOwner: boolean;
  read: boolean;
  createdAt: string;
  isEndChat?: boolean;
}

interface StoredChatSession {
  customerId: string;
  customerName: string;
  customerPhone: string;
  isEnded?: boolean;
}

const STORAGE_KEY = "candela_chat_session";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [stage, setStage] = useState<"intro" | "chat">("intro");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // 1. Restore persistent session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: StoredChatSession = JSON.parse(stored);
        if (session.customerId) {
          setCustomerId(session.customerId);
          setCustomerName(session.customerName || "");
          setCustomerPhone(session.customerPhone || "");
          setIsEnded(Boolean(session.isEnded));
          setStage("chat");

          // Immediately fetch conversation history
          fetch(`/api/chat?customerId=${session.customerId}&role=customer`)
            .then((r) => r.json())
            .then((data: ChatMessage[]) => {
              if (Array.isArray(data)) {
                setMessages(data);
                prevMessagesCountRef.current = data.length;
                const last = data[data.length - 1];
                if (last && (last.content === "[CHAT_ENDED]" || last.isEndChat)) {
                  setIsEnded(true);
                }
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Could not read chat session from storage:", e);
    }
  }, []);

  // 2. Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, stage]);

  // 3. Clear unread badge when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // 4. Real-time fast polling (2.5s when open, 6s when minimized)
  const pollMessages = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await fetch(`/api/chat?customerId=${customerId}&role=customer`);
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      if (!Array.isArray(data)) return;

      // Check if new incoming owner messages arrived
      const previousCount = prevMessagesCountRef.current;
      const newMessages = data.slice(previousCount);
      const hasNewOwnerMsg = newMessages.some((m) => m.fromOwner && m.content !== "[CHAT_ENDED]");
      const lastMsg = data[data.length - 1];

      if (lastMsg && (lastMsg.content === "[CHAT_ENDED]" || lastMsg.isEndChat)) {
        setIsEnded(true);
      }

      if (!isInitialLoadRef.current && hasNewOwnerMsg) {
        playNotificationSound("message");
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }

      isInitialLoadRef.current = false;
      prevMessagesCountRef.current = data.length;
      setMessages(data);
    } catch (e) {
      // Non-blocking poll failure
    }
  }, [customerId, isOpen]);

  useEffect(() => {
    if (!customerId) return;
    const intervalTime = isOpen ? 2500 : 6000;
    const interval = setInterval(pollMessages, intervalTime);
    return () => clearInterval(interval);
  }, [customerId, isOpen, pollMessages]);

  // 5. Start a fresh chat
  const startChat = async () => {
    if (!customerName.trim() || !customerPhone.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          content: `Hi! I'm ${customerName.trim()}. I'd like to ask about your fragrances.`,
          fromOwner: false,
        }),
      });

      const data = await res.json();
      if (data.customerId) {
        setCustomerId(data.customerId);
        setIsEnded(false);
        setStage("chat");
        setMessages([data]);
        prevMessagesCountRef.current = 1;

        // Persist session
        const session: StoredChatSession = {
          customerId: data.customerId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          isEnded: false,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    } catch (err) {
      console.error("Start chat error:", err);
    } finally {
      setSending(false);
    }
  };

  // 6. Send message
  const sendMessage = async (presetText?: string) => {
    const textToSend = (presetText || input).trim();
    if (!textToSend || !customerId || sending || isEnded) return;

    setSending(true);
    if (!presetText) setInput("");

    // Optimistic message
    const tempId = "temp-" + Date.now();
    const optimistic: ChatMessage = {
      id: tempId,
      content: textToSend,
      fromOwner: false,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          content: textToSend,
          fromOwner: false,
        }),
      });

      const realMsg = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? realMsg : m)));
      prevMessagesCountRef.current = prevMessagesCountRef.current + 1;
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // 7. End Chat
  const handleEndChat = async () => {
    if (!customerId) return;
    setConfirmEnd(false);
    setIsEnded(true);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          action: "END_CHAT",
          fromOwner: false,
        }),
      });

      playNotificationSound("end");

      // Update storage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        session.isEnded = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }

      // Re-fetch thread to include closing marker
      pollMessages();
    } catch (err) {
      console.error("Error ending chat:", err);
    }
  };

  // 8. Start brand new conversation
  const handleStartNewChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setCustomerId(null);
    setMessages([]);
    setIsEnded(false);
    setConfirmEnd(false);
    setStage("intro");
    prevMessagesCountRef.current = 0;
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 bg-candela-black text-white font-body text-xs tracking-widest uppercase shadow-2xl transition-all"
            style={{
              borderRadius: "100px",
              boxShadow: "0 12px 36px rgba(244,167,185,0.35), 0 4px 14px rgba(0,0,0,0.2)",
              border: "1px solid rgba(244,167,185,0.3)",
            }}
          >
            <div className="relative">
              <span className="text-base">💬</span>
              {/* Green active dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-candela-black animate-pulse" />
            </div>
            <span className="font-medium tracking-wider">
              {stage === "chat" && !isEnded ? "Active Chat" : "Chat with Candela"}
            </span>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-candela-pink-deep text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[400px] flex flex-col overflow-hidden"
            style={{
              height: "560px",
              borderRadius: "28px",
              background: "rgba(255, 252, 250, 0.98)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(244,167,185,0.3)",
              boxShadow: "0 28px 90px rgba(0,0,0,0.2), 0 10px 30px rgba(244,167,185,0.25)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 text-white"
              style={{ background: "linear-gradient(135deg, #181818 0%, #282828 100%)" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-candela-pink to-candela-pink-deep flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    C
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-candela-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-white text-base tracking-wide font-normal">
                      CANDELA
                    </p>
                    <span className="text-[9px] uppercase tracking-wider bg-white/10 text-candela-pink px-2 py-0.5 rounded-full">
                      Live Advisor
                    </span>
                  </div>
                  <p className="font-body text-white/50 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isEnded ? "Chat Ended" : "Online · Quick replies"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* End Chat Button (only visible when in active chat) */}
                {stage === "chat" && !isEnded && (
                  <button
                    onClick={() => setConfirmEnd(true)}
                    className="px-2.5 py-1 text-[11px] font-body text-white/60 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                    title="End this conversation"
                  >
                    End Chat
                  </button>
                )}

                {/* Close/Minimize Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* End Chat Confirmation Modal */}
            <AnimatePresence>
              {confirmEnd && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 border-b border-amber-200 p-3.5 px-4 text-xs font-body text-amber-900 flex items-center justify-between gap-3 shadow-sm z-10"
                >
                  <div>
                    <p className="font-medium">End this live chat?</p>
                    <p className="text-amber-700 text-[11px]">The conversation will conclude.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmEnd(false)}
                      className="px-3 py-1 bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEndChat}
                      className="px-3 py-1 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                    >
                      End Now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STAGE 1: INTRO FORM */}
            {stage === "intro" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col justify-between p-6 overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="text-center pt-2">
                    <span className="inline-block text-3xl mb-2">🌸</span>
                    <h3 className="font-display text-2xl text-candela-charcoal font-light">
                      Welcome to Candela
                    </h3>
                    <p className="font-body text-xs text-candela-charcoal/60 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Connect with our fragrance concierges for scent advice, order updates, or personal styling.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-body uppercase tracking-wider text-candela-charcoal/70 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Layla Nour"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-candela-pink/30 rounded-xl font-body text-sm text-candela-black focus:outline-none focus:border-candela-pink transition-colors shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-body uppercase tracking-wider text-candela-charcoal/70 mb-1">
                        Phone Number (WhatsApp or Call)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 010 1234 5678"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && startChat()}
                        className="w-full px-4 py-2.5 bg-white border border-candela-pink/30 rounded-xl font-body text-sm text-candela-black focus:outline-none focus:border-candela-pink transition-colors shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startChat}
                    disabled={!customerName.trim() || !customerPhone.trim() || sending}
                    className="w-full py-3 bg-candela-black text-white font-body text-xs tracking-widest uppercase rounded-xl disabled:opacity-40 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <span>Connecting...</span>
                    ) : (
                      <>
                        <span>Start Live Chat</span>
                        <span>➔</span>
                      </>
                    )}
                  </motion.button>
                  <p className="text-[10px] font-body text-center text-candela-charcoal/40 mt-2">
                    We value your privacy · No spam guaranteed
                  </p>
                </div>
              </motion.div>
            )}

            {/* STAGE 2: LIVE CONVERSATION */}
            {stage === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-candela-cream/30 to-white">
                {/* Message stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Status announcement */}
                  <div className="flex justify-center">
                    <span className="font-body text-[10px] text-candela-charcoal/50 bg-white/80 border border-candela-pink/20 px-3 py-1 rounded-full shadow-xs">
                      {isEnded ? "Chat ended" : "🌸 Chat connected · Candela is notified"}
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isSystemEnd = msg.content === "[CHAT_ENDED]" || msg.isEndChat;

                    if (isSystemEnd) {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="bg-candela-pink/15 border border-candela-pink/30 rounded-2xl px-4 py-2 text-center max-w-[85%] shadow-xs">
                            <p className="font-body text-xs font-medium text-candela-charcoal">
                              ✨ Conversation concluded
                            </p>
                            <p className="font-body text-[10px] text-candela-charcoal/60 mt-0.5">
                              {msg.fromOwner
                                ? "Candela has closed this chat session."
                                : "You closed this chat session."}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.fromOwner ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[78%] p-3 rounded-2xl ${
                            msg.fromOwner
                              ? "bg-white text-candela-charcoal border border-candela-pink/25 shadow-xs rounded-tl-sm"
                              : "bg-candela-black text-white rounded-tr-sm shadow-md"
                          }`}
                        >
                          {msg.fromOwner && (
                            <p className="font-body text-[10px] font-bold tracking-wider uppercase text-candela-pink-deep mb-1">
                              Candela
                            </p>
                          )}
                          <p className="font-body text-xs leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                            <span className="font-body text-[9px]">
                              {new Date(msg.createdAt).toLocaleTimeString("en-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {!msg.fromOwner && (
                              <span
                                className="text-[10px]"
                                title={msg.read ? "Seen by Candela" : "Delivered"}
                              >
                                {msg.read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Quick prompt suggestions (when chat is active) */}
                {!isEnded && messages.length <= 3 && (
                  <div className="px-4 py-2 flex gap-1.5 overflow-x-auto border-t border-gray-100 bg-white/50 scrollbar-none">
                    {[
                      "Which mist is most popular?",
                      "How long does delivery take?",
                      "Do you offer gift boxes?",
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(prompt)}
                        className="flex-shrink-0 text-[11px] font-body text-candela-charcoal/70 bg-candela-pink/10 hover:bg-candela-pink/20 px-2.5 py-1 rounded-full border border-candela-pink/20 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input area or Ended Banner */}
                {isEnded ? (
                  <div className="p-4 border-t border-candela-pink/20 bg-white text-center space-y-2">
                    <p className="font-body text-xs text-candela-charcoal/60">
                      Need anything else? You can start a fresh conversation anytime.
                    </p>
                    <button
                      onClick={handleStartNewChat}
                      className="px-5 py-2.5 bg-candela-black text-white font-body text-xs tracking-widest uppercase rounded-xl hover:bg-candela-charcoal transition-colors shadow-sm"
                    >
                      Start New Chat
                    </button>
                  </div>
                ) : (
                  <div className="p-3 border-t border-candela-pink/20 bg-white flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2.5 bg-candela-pink/5 border border-candela-pink/25 rounded-xl font-body text-xs text-candela-black placeholder-candela-charcoal/40 focus:outline-none focus:border-candela-pink transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendMessage()}
                      disabled={sending || !input.trim()}
                      className="w-10 h-10 bg-candela-black rounded-xl flex items-center justify-center text-white disabled:opacity-30 transition-opacity shadow-sm"
                      title="Send message"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
