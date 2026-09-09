"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { playNotificationSound } from "@/lib/audio";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "◉" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/products", label: "Products", icon: "🌸" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/messages", label: "Messages", icon: "💬", hasBadge: true },
  { href: "/admin/analytics", label: "Analytics", icon: "📊" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

interface ChatNotification {
  id: string;
  customerName: string;
  content: string;
  customerId: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [storeName, setStoreName] = useState("CANDELA");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeToast, setActiveToast] = useState<ChatNotification | null>(null);

  const lastNotifiedMsgIdRef = useRef<string | null>(null);
  const initialSummaryDoneRef = useRef(false);

  // 1. Fetch Profile & Settings
  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setProfile(d);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.store_name) setStoreName(d.store_name);
      })
      .catch(() => {});
  }, [pathname]);

  // 2. Global background chat notification listener
  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const res = await fetch("/api/chat?role=admin&summary=true");
        if (!res.ok) return;
        const data = await res.json();

        setUnreadMessages(data.unreadCount || 0);

        // Check if there is a new incoming unread customer message
        if (data.latestMessage && data.latestMessage.id !== lastNotifiedMsgIdRef.current) {
          lastNotifiedMsgIdRef.current = data.latestMessage.id;

          // Only alert after initial check (so page load doesn't trigger audio for past unread)
          if (initialSummaryDoneRef.current) {
            playNotificationSound("admin-alert");

            // Native device notification
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(`💬 New message from ${data.latestMessage.customerName}`, {
                  body: data.latestMessage.content,
                  icon: "/candela-logo.png",
                  tag: `candela-chat-${data.latestMessage.customerId}`,
                });
              } catch {}
            }

            // In-app Toast Banner (if not already on the messages page)
            if (pathname !== "/admin/messages") {
              setActiveToast({
                id: data.latestMessage.id,
                customerName: data.latestMessage.customerName,
                content: data.latestMessage.content,
                customerId: data.latestMessage.customerId,
              });
            }
          }
        }

        initialSummaryDoneRef.current = true;
      } catch (err) {
        // Non-blocking
      }
    };

    checkUnreadMessages();
    const poll = setInterval(checkUnreadMessages, 4000);
    return () => clearInterval(poll);
  }, [pathname]);

  // Auto-dismiss in-app toast after 7s
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => setActiveToast(null), 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6" style={{ background: "#0D0D0D" }}>
      {/* Logo */}
      <div className="mb-6">
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: "1.5rem",
            letterSpacing: "0.2em",
            color: "white",
          }}
        >
          {storeName}
        </p>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.25em",
            color: "rgba(244,167,185,0.6)",
            textTransform: "uppercase",
            marginTop: "2px",
          }}
        >
          Admin Dashboard
        </p>
      </div>

      {/* Admin Identity Card */}
      <div className="mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-body">
            Admin Access
          </span>
        </div>
        <p className="text-xs text-white/90 font-medium truncate font-body">
          {profile?.name || session?.user?.name || session?.user?.email || "Store Admin"}
        </p>
        {(profile?.email || session?.user?.email) && (
          <p className="text-[10px] text-white/40 truncate font-body mt-0.5">
            {profile?.email || session?.user?.email}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.hasBadge && unreadMessages > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive ? "rgba(244,167,185,0.12)" : "transparent",
                color: isActive ? "#F4A7B9" : "rgba(255,255,255,0.5)",
                borderLeft: isActive ? "2px solid #F4A7B9" : "2px solid transparent",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.label}
                </span>
              </div>

              {showBadge && (
                <span className="px-2 py-0.5 rounded-full bg-candela-pink text-candela-black font-body text-[10px] font-bold animate-pulse shadow-sm">
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Store Link & Sign Out */}
      <div className="pt-4 border-t border-white/5 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-white/50 hover:text-white hover:bg-white/5 text-xs font-body"
        >
          <span>🛍️</span>
          View Store ↗
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 text-xs font-body cursor-pointer"
        >
          <span>↪</span>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating In-App Chat Notification Banner */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-32px)] bg-[#1A1A1A] border border-candela-pink/40 text-white p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-3"
            style={{
              boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(244,167,185,0.2)",
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-candela-pink/20 text-candela-pink flex items-center justify-center font-bold text-sm flex-shrink-0">
                💬
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-body text-xs font-semibold text-white truncate">
                    {activeToast.customerName}
                  </p>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-candela-pink/20 text-candela-pink uppercase font-medium">
                    New Chat
                  </span>
                </div>
                <p className="font-body text-xs text-white/70 truncate mt-0.5">
                  {activeToast.content}
                </p>
                <button
                  onClick={() => {
                    setActiveToast(null);
                    router.push(`/admin/messages`);
                  }}
                  className="mt-2 text-[11px] font-body text-candela-pink hover:underline font-medium inline-block"
                >
                  Reply Now ➔
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-white/40 hover:text-white p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div
        className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 border-r"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "#0D0D0D", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "1.2rem",
              letterSpacing: "0.2em",
              color: "white",
            }}
          >
            CANDELA
          </p>
          {unreadMessages > 0 && (
            <span className="w-2 h-2 rounded-full bg-candela-pink animate-ping" />
          )}
        </div>
        <button onClick={() => setMobileOpen(true)} style={{ color: "rgba(255,255,255,0.6)" }}>
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.7)" }}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
