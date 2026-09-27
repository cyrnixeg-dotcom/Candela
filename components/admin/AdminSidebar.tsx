"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { playNotificationSound } from "@/lib/audio";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "◉" },
  { href: "/admin/orders", label: "Orders", icon: "📦", badgeKey: "orders" },
  { href: "/admin/products", label: "Products", icon: "🌸" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/messages", label: "Messages", icon: "💬", badgeKey: "messages" },
  { href: "/admin/analytics", label: "Analytics", icon: "📊" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

interface ChatNotification {
  id: string;
  customerName: string;
  content: string;
  customerId: string;
}

interface OrderNotification {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  city: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [storeName, setStoreName] = useState("CANDELA");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [activeToast, setActiveToast] = useState<ChatNotification | null>(null);
  const [activeOrderToast, setActiveOrderToast] = useState<OrderNotification | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const lastNotifiedMsgIdRef = useRef<string | null>(null);
  const initialSummaryDoneRef = useRef(false);
  const lastNotifiedOrderIdRef = useRef<string | null>(null);
  const initialOrdersDoneRef = useRef(false);

  // Check alert permissions on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setAlertsEnabled(Notification.permission === "granted");
    }
  }, []);

  // 1. Fetch Profile & Settings
  useEffect(() => {
    fetch("/api/admin/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setProfile(d);
      })
      .catch(() => {});

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.store_name) setStoreName(d.store_name);
      })
      .catch(() => {});
  }, [pathname]);

  // Request notifications and test sound/vibration
  const requestAlertsPermission = async () => {
    playNotificationSound("order-alert");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([250, 100, 250]);
      } catch {}
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setAlertsEnabled(true);
          new Notification("🛍️ Candela Alerts Activated!", {
            body: "You will receive real-time audio and vibration alerts for incoming orders!",
            icon: "/candela-logo.png",
          });
        }
      } catch {}
    }
  };

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

            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate([200, 100, 200]);
              } catch {}
            }

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

  // 3. Global background order notification listener
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const res = await fetch(`/api/orders?limit=1&t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (typeof data.pendingCount === "number") {
          setPendingOrdersCount(data.pendingCount);
        }

        const latestOrder = data.orders?.[0];
        if (latestOrder && latestOrder.id !== lastNotifiedOrderIdRef.current) {
          const isFirstCheck = !initialOrdersDoneRef.current;
          lastNotifiedOrderIdRef.current = latestOrder.id;

          if (!isFirstCheck) {
            // New order received while admin is active!
            playNotificationSound("order-alert");

            // Vibrate phone
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              try {
                navigator.vibrate([300, 150, 300, 150, 500]);
              } catch {}
            }

            // Native push notification
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(`🛍️ New Order #${latestOrder.orderNumber}!`, {
                  body: `${latestOrder.customer?.name || "Customer"} placed an order for ${latestOrder.total} EGP`,
                  icon: "/candela-logo.png",
                  tag: `candela-order-${latestOrder.id}`,
                });
              } catch {}
            }

            // In-app Order Banner
            setActiveOrderToast({
              id: latestOrder.id,
              orderNumber: latestOrder.orderNumber,
              customerName: latestOrder.customer?.name || "Customer",
              customerPhone: latestOrder.customer?.phone || "",
              total: latestOrder.total,
              city: latestOrder.city || "",
            });

            // Dispatch global event so Orders & Overview pages refresh instantly
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("candela:new-order", { detail: latestOrder }));
            }
          }

          initialOrdersDoneRef.current = true;
        }
      } catch (err) {
        // Non-blocking
      }
    };

    checkNewOrders();
    const orderPoll = setInterval(checkNewOrders, 4000);
    return () => clearInterval(orderPoll);
  }, []);

  // Auto-dismiss chat toast after 7s
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => setActiveToast(null), 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Auto-dismiss order toast after 10s
  useEffect(() => {
    if (!activeOrderToast) return;
    const timer = setTimeout(() => setActiveOrderToast(null), 10000);
    return () => clearTimeout(timer);
  }, [activeOrderToast]);

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6" style={{ background: "#0D0D0D" }}>
      {/* Logo */}
      <div className="mb-4">
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
      <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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

      {/* Phone & Desktop Alert Card */}
      <div className="mb-5">
        {alertsEnabled ? (
          <button
            onClick={() => {
              playNotificationSound("order-alert");
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                try {
                  navigator.vibrate([250, 100, 250]);
                } catch {}
              }
            }}
            className="w-full text-left p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-body flex items-center justify-between hover:bg-emerald-500/15 transition-all cursor-pointer group"
            title="Tap to test order chime and vibration"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Phone Alerts Active</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 bg-emerald-500/20 px-2 py-0.5 rounded font-mono group-hover:text-emerald-200">
              Test 🔊
            </span>
          </button>
        ) : (
          <button
            onClick={requestAlertsPermission}
            className="w-full text-left p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-body flex items-center justify-between hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
            title="Tap to enable sound & phone vibration when orders are placed"
          >
            <div className="flex items-center gap-2">
              <span>🔔</span>
              <span className="font-semibold">Enable Phone Alerts</span>
            </div>
            <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Turn On
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const showOrderBadge = item.badgeKey === "orders" && pendingOrdersCount > 0;
          const showMsgBadge = item.badgeKey === "messages" && unreadMessages > 0;

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

              {showOrderBadge && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-body text-[10px] font-bold animate-pulse shadow-sm">
                  {pendingOrdersCount}
                </span>
              )}

              {showMsgBadge && !showOrderBadge && (
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
      {/* Floating In-App Order Notification Banner */}
      <AnimatePresence>
        {activeOrderToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-32px)] bg-[#141414] border border-amber-400/50 text-white p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-3"
            style={{
              boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 25px rgba(251,191,36,0.25)",
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-lg flex-shrink-0 animate-bounce">
                🛍️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-body text-xs font-bold text-white truncate">
                    Order #{activeOrderToast.orderNumber}
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold uppercase tracking-wider">
                    New Order
                  </span>
                </div>
                <p className="font-body text-xs text-white/90 font-medium truncate mt-0.5">
                  {activeOrderToast.customerName} • {activeOrderToast.total} EGP
                </p>
                {activeOrderToast.city && (
                  <p className="font-body text-[10px] text-white/50 truncate">
                    📍 {activeOrderToast.city}
                  </p>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveOrderToast(null);
                      router.push("/admin/orders");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-[11px] font-body font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    View Order ➔
                  </button>
                  {activeOrderToast.customerPhone && (
                    <a
                      href={`https://wa.me/${activeOrderToast.customerPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-body hover:bg-emerald-500/30 transition-colors"
                    >
                      WhatsApp 💬
                    </a>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveOrderToast(null)}
              className="text-white/40 hover:text-white p-1 text-sm cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating In-App Chat Notification Banner */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed ${
              activeOrderToast ? "top-32" : "top-4"
            } right-4 z-50 max-w-sm w-[calc(100vw-32px)] bg-[#1A1A1A] border border-candela-pink/40 text-white p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-3`}
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
                  className="mt-2 text-[11px] font-body text-candela-pink hover:underline font-medium inline-block cursor-pointer"
                >
                  Reply Now ➔
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-white/40 hover:text-white p-1 cursor-pointer"
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
            {storeName}
          </p>
          {unreadMessages > 0 && (
            <span className="w-2 h-2 rounded-full bg-candela-pink animate-ping" title="New Message" />
          )}
          {pendingOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold animate-pulse" title="Pending Orders">
              {pendingOrdersCount} NEW
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!alertsEnabled && (
            <button
              onClick={requestAlertsPermission}
              className="text-[10px] bg-amber-400 text-black px-2.5 py-1 rounded-lg font-bold shadow-sm cursor-pointer"
            >
              🔔 Alerts
            </button>
          )}
          <button onClick={() => setMobileOpen(true)} style={{ color: "rgba(255,255,255,0.6)" }} className="p-1 text-lg cursor-pointer">
            ☰
          </button>
        </div>
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
