"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  content: string;
  fromOwner: boolean;
  read: boolean;
  createdAt: string;
  customer: { name: string; phone: string };
  customerId: string;
}

interface ConversationPreview {
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  unreadCount: number;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load all messages and build conversation list
  const loadMessages = async () => {
    const res = await fetch("/api/chat");
    const data: Message[] = await res.json();
    setMessages(data);

    // Build conversation previews
    const convMap = new Map<string, ConversationPreview>();
    for (const msg of data) {
      const existing = convMap.get(msg.customerId);
      if (!existing) {
        convMap.set(msg.customerId, {
          customerId: msg.customerId,
          customerName: msg.customer.name,
          customerPhone: msg.customer.phone,
          lastMessage: msg.content,
          unreadCount: !msg.read && !msg.fromOwner ? 1 : 0,
          createdAt: msg.createdAt,
        });
      } else {
        existing.lastMessage = msg.content;
        existing.createdAt = msg.createdAt;
        if (!msg.read && !msg.fromOwner) existing.unreadCount++;
      }
    }
    setConversations(Array.from(convMap.values()).reverse());
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetch(`/api/chat?customerId=${selectedCustomerId}`).then((r) => r.json()).then((data) => {
        setMessages((prev) => {
          const ids = new Set(data.map((m: Message) => m.id));
          return [...prev.filter((m) => m.customerId !== selectedCustomerId), ...data];
        });
        // Update unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.customerId === selectedCustomerId ? { ...c, unreadCount: 0 } : c
          )
        );
      });
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedCustomerId]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedCustomerId || sending) return;
    setSending(true);
    const content = reply.trim();
    setReply("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedCustomerId, content, fromOwner: true }),
      });
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  };

  const threadMessages = messages.filter((m) => m.customerId === selectedCustomerId);

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10 h-[calc(100vh-0px)]">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em", marginBottom: "8px" }}>
        Messages
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'Jost', sans-serif", marginBottom: "24px" }}>
        Chat with your customers
      </p>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          {conversations.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontFamily: "'Jost', sans-serif", fontSize: "0.8rem" }}>
              No messages yet
            </div>
          )}
          {conversations.map((conv) => (
            <motion.button
              key={conv.customerId}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedCustomerId(conv.customerId)}
              className="w-full text-left p-4 rounded-xl transition-all"
              style={{
                background: selectedCustomerId === conv.customerId
                  ? "rgba(244,167,185,0.1)"
                  : "rgba(255,255,255,0.03)",
                border: selectedCustomerId === conv.customerId
                  ? "1px solid rgba(244,167,185,0.2)"
                  : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  {conv.customerName}
                </p>
                {conv.unreadCount > 0 && (
                  <span style={{ background: "#F4A7B9", color: "#1A1A1A", fontSize: "0.65rem", fontWeight: "bold", padding: "1px 6px", borderRadius: "100px" }}>
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {conv.lastMessage}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Chat thread */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {!selectedCustomerId ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Jost', sans-serif" }}>
              Select a conversation
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  {conversations.find((c) => c.customerId === selectedCustomerId)?.customerName}
                </p>
                <a href={`tel:${conversations.find((c) => c.customerId === selectedCustomerId)?.customerPhone}`}
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: "rgba(244,167,185,0.6)" }}>
                  {conversations.find((c) => c.customerId === selectedCustomerId)?.customerPhone}
                </a>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {threadMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.fromOwner ? "justify-end" : "justify-start"}`}>
                    <div style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: msg.fromOwner ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: msg.fromOwner ? "#F4A7B9" : "rgba(255,255,255,0.08)",
                      color: msg.fromOwner ? "#1A1A1A" : "rgba(255,255,255,0.8)",
                    }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.85rem", lineHeight: 1.5 }}>
                        {msg.content}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.6rem", opacity: 0.5, marginTop: "4px", textAlign: "right" }}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-EG", { hour: "2-digit", minute: "2-digit" })}
                        {msg.fromOwner ? " · Candela" : ""}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply input */}
              <div className="px-4 py-3 flex gap-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Type a reply as Candela..."
                  style={{
                    flex: 1, padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)",
                    borderRadius: "12px",
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  style={{
                    width: "40px", height: "40px",
                    background: "#F4A7B9",
                    borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#1A1A1A", fontSize: "1rem",
                    opacity: sending || !reply.trim() ? 0.4 : 1,
                  }}
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
