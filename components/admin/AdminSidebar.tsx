"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "◉" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/products", label: "Products", icon: "🌸" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/messages", label: "Messages", icon: "💬" },
  { href: "/admin/analytics", label: "Analytics", icon: "📊" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [storeName, setStoreName] = useState("CANDELA");

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

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6" style={{ background: "#0D0D0D" }}>
      {/* Logo */}
      <div className="mb-6">
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.5rem", letterSpacing: "0.2em", color: "white" }}>
          {storeName}
        </p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", letterSpacing: "0.25em", color: "rgba(244,167,185,0.6)", textTransform: "uppercase", marginTop: "2px" }}>
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
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive ? "rgba(244,167,185,0.12)" : "transparent",
                color: isActive ? "#F4A7B9" : "rgba(255,255,255,0.5)",
                borderLeft: isActive ? "2px solid #F4A7B9" : "2px solid transparent",
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.05em" }}>
                {item.label}
              </span>
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
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 border-r" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b" style={{ background: "#0D0D0D", borderColor: "rgba(255,255,255,0.05)" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.2rem", letterSpacing: "0.2em", color: "white" }}>
          CANDELA
        </p>
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
