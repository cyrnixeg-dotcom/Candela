"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playNotificationSound } from "@/lib/audio";

interface Message {
  id: string;
  content: string;
  fromOwner: boolean;
  read: boolean;
  createdAt: string;
  customer: { name: string; phone: string };
  customerId: string;
  isEndChat?: boolean;
}

interface ConversationPreview {
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  unreadCount: number;
  createdAt: string;
  isEnded: boolean;
}

const QUICK_REPLIES = [
  "Hello! Welcome to Candela. How can I help you today? 🌸",
  "Yes, this fragrance is in stock and ready for delivery!",
  "Delivery across Cairo & Giza takes 24-48 hours.",
  "Thank you for contacting Candela! Please let me know if you need anything else.",
];

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  const bottomRef = useRef<HTMLDivElement>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const originalTitleRef = useRef("Messages | CANDELA Admin");

  // 1. Check Notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        playNotificationSound("message");
        try {
          new Notification("Candela Live Alerts Active", {
            body: "You will now be notified on this device when customers send a message.",
            icon: "/candela-logo.png",
          });
        } catch {}
      }
    }
  };

  // 2. Load conversations and notify on new customer messages
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?role=admin");
      if (!res.ok) return;
      const data: Message[] = await res.json();
      if (!Array.isArray(data)) return;

      // Detect any brand-new incoming messages from customers
      if (initialLoadDoneRef.current) {
        const newCustomerMsgs = data.filter(
          (m) =>
            !knownMessageIdsRef.current.has(m.id) &&
            !m.fromOwner &&
            m.content !== "[CHAT_ENDED]"
        );

        if (newCustomerMsgs.length > 0) {
          // Play audio chime on admin device
          playNotificationSound("admin-alert");

          // Trigger native device notification
          const latest = newCustomerMsgs[newCustomerMsgs.length - 1];
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`💬 New message from ${latest.customer?.name || "Customer"}`, {
                body: latest.content,
                icon: "/candela-logo.png",
                tag: `candela-chat-${latest.customerId}`,
              });
            } catch {}
          }
        }
      }

      // Update known IDs
      data.forEach((m) => knownMessageIdsRef.current.add(m.id));
      initialLoadDoneRef.current = true;

      // Build conversation previews
      const convMap = new Map<string, ConversationPreview>();
      for (const msg of data) {
        const existing = convMap.get(msg.customerId);
        const isEnd = msg.content === "[CHAT_ENDED]";

        if (!existing) {
          convMap.set(msg.customerId, {
            customerId: msg.customerId,
            customerName: msg.customer.name,
            customerPhone: msg.customer.phone,
            lastMessage: isEnd ? "Chat concluded" : msg.content,
            unreadCount: !msg.read && !msg.fromOwner && !isEnd ? 1 : 0,
            createdAt: msg.createdAt,
            isEnded: isEnd,
          });
        } else {
          existing.lastMessage = isEnd ? "Chat concluded" : msg.content;
          existing.createdAt = msg.createdAt;
          existing.isEnded = isEnd;
          if (!msg.read && !msg.fromOwner && !isEnd) {
            existing.unreadCount++;
          }
        }
      }

      setConversations(Array.from(convMap.values()).reverse());
    } catch (err) {
      // Non-blocking
    }
  }, []);

  // 3. Load active thread messages (fast 2.5s poll)
  const loadThread = useCallback(async (customerId: string) => {
    try {
      const res = await fetch(`/api/chat?customerId=${customerId}&role=admin`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      if (!Array.isArray(data)) return;

      setMessages((prev) => {
        const otherMessages = prev.filter((m) => m.customerId !== customerId);
        return [...otherMessages, ...data];
      });

      // Clear unread count for this customer in list
      setConversations((prev) =>
        prev.map((c) => (c.customerId === customerId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (e) {}
  }, []);

  // Poll loop: 5s for conversations list, 2.5s for active selected thread
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    loadThread(selectedCustomerId);
    const interval = setInterval(() => loadThread(selectedCustomerId), 2500);
    return () => clearInterval(interval);
  }, [selectedCustomerId, loadThread]);

  // Document Title Flashing for Unread Messages
  useEffect(() => {
    const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
    if (totalUnread > 0) {
      let toggle = false;
      const titleTimer = setInterval(() => {
        document.title = toggle
          ? `(${totalUnread}) 💬 New Message! · CANDELA`
          : "Messages | CANDELA Admin";
        toggle = !toggle;
      }, 1000);
      return () => {
        clearInterval(titleTimer);
        document.title = originalTitleRef.current;
      };
    } else {
      document.title = originalTitleRef.current;
    }
  }, [conversations]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedCustomerId]);

  // Send Reply
  const sendReply = async (presetText?: string) => {
    const text = (presetText || reply).trim();
    if (!text || !selectedCustomerId || sending) return;

    setSending(true);
    if (!presetText) setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          content: text,
          fromOwner: true,
        }),
      });
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      loadConversations();
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSending(false);
    }
  };

  // End Chat as Admin
  const handleEndChat = async () => {
    if (!selectedCustomerId || sending) return;
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          action: "END_CHAT",
          fromOwner: true,
        }),
      });
      playNotificationSound("end");
      await loadThread(selectedCustomerId);
      await loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Reopen Chat
  const handleReopenChat = async () => {
    if (!selectedCustomerId || sending) return;
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          content: "Chat reopened by Candela. We're here to assist you! 🌸",
          fromOwner: true,
        }),
      });
      playNotificationSound("message");
      await loadThread(selectedCustomerId);
      await loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.customerId === selectedCustomerId);
  const threadMessages = messages.filter((m) => m.customerId === selectedCustomerId);
  const isSelectedChatEnded = Boolean(
    selectedConv?.isEnded ||
      (threadMessages.length > 0 &&
        threadMessages[threadMessages.length - 1].content === "[CHAT_ENDED]")
  );

  const filteredConversations = conversations.filter((c) => {
    if (filter === "active") return !c.isEnded;
    if (filter === "ended") return c.isEnded;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 pt-16 lg:pt-8 h-[calc(100vh-0px)] flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.2rem",
                fontWeight: 300,
                color: "white",
                letterSpacing: "0.08em",
              }}
            >
              Live Messages
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-white/10 text-candela-pink border border-white/10">
              Real-Time
            </span>
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.8rem",
              fontFamily: "'Jost', sans-serif",
            }}
          >
            Instant customer conversations & device notifications
          </p>
        </div>

        {/* Device Notification Status & Prompt */}
        <div className="flex items-center gap-3">
          {notifPermission === "granted" ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-body text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Device Alerts Enabled</span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={requestNotificationPermission}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-candela-pink text-candela-black font-body text-xs font-medium tracking-wide shadow-md transition-all"
            >
              <span>🔔</span>
              <span>Enable Device Notifications</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left: Conversation List */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          {/* Tabs Filter */}
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-1">
            {(["all", "active", "ended"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex-1 py-1.5 text-xs font-body rounded-lg capitalize transition-colors ${
                  filter === t
                    ? "bg-white/10 text-white font-medium shadow-xs"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-white/30 font-body text-xs">
                No {filter !== "all" ? filter : ""} conversations yet.
              </div>
            )}

            {filteredConversations.map((conv) => {
              const isSelected = selectedCustomerId === conv.customerId;
              return (
                <button
                  key={conv.customerId}
                  onClick={() => setSelectedCustomerId(conv.customerId)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                    isSelected
                      ? "bg-candela-pink/10 border-candela-pink/30 text-white shadow-xs"
                      : "bg-white/[0.02] border-white/[0.04] text-white/80 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          conv.isEnded ? "bg-gray-500" : "bg-emerald-400 animate-pulse"
                        }`}
                        title={conv.isEnded ? "Chat ended" : "Live now"}
                      />
                      <p className="font-body text-xs font-medium text-white/90 truncate max-w-[140px]">
                        {conv.customerName || "Customer"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {conv.unreadCount > 0 && (
                        <span className="bg-candela-pink text-candela-black font-body text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                          {conv.unreadCount} new
                        </span>
                      )}
                      {conv.isEnded && (
                        <span className="text-[9px] font-body text-white/30 uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-body text-[11px] text-white/40 truncate mb-1">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-white/30 font-body">
                    <span>{conv.customerPhone || "—"}</span>
                    <span>
                      {new Date(conv.createdAt).toLocaleTimeString("en-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat View */}
        <div className="flex-1 flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden min-h-0">
          {!selectedCustomerId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30 font-body text-sm">
              <span className="text-4xl mb-3 opacity-60">💬</span>
              <p className="text-white/60 text-base font-display mb-1">Select a Conversation</p>
              <p className="text-xs max-w-[260px]">
                Choose a customer from the left to read messages and respond in real time.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-candela-pink/20 text-candela-pink flex items-center justify-center font-bold text-sm">
                    {selectedConv?.customerName?.[0] || "C"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm font-medium text-white">
                        {selectedConv?.customerName}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-body ${
                          isSelectedChatEnded
                            ? "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isSelectedChatEnded ? "Chat Ended" : "Live Chat"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-body text-white/40 mt-0.5">
                      <a
                        href={`tel:${selectedConv?.customerPhone}`}
                        className="hover:text-candela-pink transition-colors"
                      >
                        📞 {selectedConv?.customerPhone}
                      </a>
                      {selectedConv?.customerPhone && (
                        <a
                          href={`https://wa.me/${selectedConv.customerPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-400 transition-colors text-emerald-400/80"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions: End Chat or Reopen */}
                <div className="flex items-center gap-2">
                  {isSelectedChatEnded ? (
                    <button
                      onClick={handleReopenChat}
                      disabled={sending}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-body text-xs transition-colors border border-white/10"
                    >
                      Reopen Chat
                    </button>
                  ) : (
                    <button
                      onClick={handleEndChat}
                      disabled={sending}
                      className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 font-body text-xs transition-colors border border-red-500/20"
                    >
                      End Chat
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {threadMessages.map((msg) => {
                  const isEndMarker = msg.content === "[CHAT_ENDED]" || msg.isEndChat;

                  if (isEndMarker) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-center">
                          <p className="font-body text-xs text-white/50">
                            🔒 {msg.fromOwner ? "Chat ended by Candela" : "Chat ended by Customer"}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.fromOwner ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          padding: "10px 14px",
                          borderRadius: msg.fromOwner
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                          background: msg.fromOwner
                            ? "#F4A7B9"
                            : "rgba(255,255,255,0.07)",
                          color: msg.fromOwner ? "#1A1A1A" : "rgba(255,255,255,0.9)",
                          border: msg.fromOwner
                            ? "none"
                            : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {!msg.fromOwner && (
                          <p className="font-body text-[10px] font-medium text-candela-pink mb-1">
                            {msg.customer?.name || "Customer"}
                          </p>
                        )}
                        <p className="font-body text-xs leading-relaxed break-words whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-body ${
                            msg.fromOwner ? "text-candela-black/60" : "text-white/40"
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString("en-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {msg.fromOwner && (
                            <span title={msg.read ? "Seen by customer" : "Delivered"}>
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

              {/* Quick Replies Bar */}
              <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01] flex gap-2 overflow-x-auto scrollbar-none">
                {QUICK_REPLIES.map((replyText, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendReply(replyText)}
                    disabled={sending}
                    className="flex-shrink-0 text-[11px] font-body text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/5 transition-colors"
                  >
                    {replyText}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="p-3 border-t border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  disabled={sending}
                  placeholder={
                    isSelectedChatEnded
                      ? "Chat has ended (click Reopen Chat to message again)..."
                      : "Type a reply as Candela..."
                  }
                  className="flex-1 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl font-body text-xs text-white placeholder-white/30 focus:outline-none focus:border-candela-pink transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendReply()}
                  disabled={sending || !reply.trim() || isSelectedChatEnded}
                  className="w-10 h-10 rounded-xl bg-candela-pink text-candela-black flex items-center justify-center font-bold text-sm disabled:opacity-30 transition-opacity shadow-sm"
                  title="Send reply"
                >
                  ↑
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
