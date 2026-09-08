"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  conversionRate: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { name: string; phone: string };
}

interface TopProduct {
  id: string;
  name: string;
  views: number;
  image: string;
  subcategory: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<{
    stats: Stats;
    recentOrders: RecentOrder[];
    topProducts: TopProduct[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetch("/api/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch analytics");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load analytics data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = data?.stats;

  const STAT_CARDS = [
    { label: "Total Orders", value: stats?.totalOrders ?? "—", icon: "📦", color: "#F4A7B9", href: "/admin/orders" },
    { label: "Pending", value: stats?.pendingOrders ?? "—", icon: "⏳", color: "#FCD34D", href: "/admin/orders" },
    { label: "Revenue (EGP)", value: stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()}` : "0", icon: "💰", color: "#86EFAC", href: "/admin/orders" },
    { label: "Customers", value: stats?.totalCustomers ?? "—", icon: "👥", color: "#93C5FD", href: "/admin/customers" },
    { label: "Products", value: stats?.totalProducts ?? "—", icon: "🌸", color: "#C4B5FD", href: "/admin/products" },
    { label: "Delivered", value: stats?.deliveredOrders ?? "—", icon: "✅", color: "#6EE7B7", href: "/admin/orders" },
  ];

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em" }}>
            Overview
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: "4px", fontFamily: "'Jost', sans-serif" }}>
            Welcome back to the Candela dashboard
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-body font-medium flex items-center gap-2 transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          Refresh Overview
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-center justify-between text-xs text-red-200 font-body">
          <span>⚠️ {error}</span>
          <button onClick={loadData} className="px-3 py-1 bg-red-900 text-white rounded-lg text-xs font-bold">Retry</button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {STAT_CARDS.map((card, i) => (
          <Link key={card.label} href={card.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl cursor-pointer hover:border-pink-300/20 transition-all h-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{card.icon}</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: card.color, boxShadow: `0 0 10px ${card.color}` }}
                />
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "2rem",
                  fontWeight: 500,
                  color: "white",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                {loading ? "—" : card.value}
              </p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {card.label}
              </p>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "white" }}>
              Recent Orders
            </h2>
            <Link href="/admin/orders" style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: "rgba(244,167,185,0.7)", letterSpacing: "0.1em" }}>
              VIEW ALL →
            </Link>
          </div>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl skeleton" />
                ))
              : data?.recentOrders?.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", textAlign: "center", padding: "2rem" }}>
                    No orders yet
                  </p>
                )
              : data?.recentOrders.map((order) => (
                  <Link key={order.id} href="/admin/orders">
                    <div
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                          {order.customer.name}
                        </p>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                          {order.orderNumber} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "white" }}>
                          {order.total} EGP
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        {/* Top products */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400, color: "white" }}>
              Top Viewed Products
            </h2>
            <Link href="/admin/products" style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: "rgba(244,167,185,0.7)", letterSpacing: "0.1em" }}>
              MANAGE →
            </Link>
          </div>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl skeleton" />
                ))
              : data?.topProducts.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", textAlign: "center", padding: "2rem" }}>
                    No products yet
                  </p>
                )
              : data?.topProducts.map((product, i) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl">
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "rgba(244,167,185,0.4)", width: "20px" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                        {product.subcategory}
                      </p>
                    </div>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.75rem", color: "rgba(244,167,185,0.7)" }}>
                      {product.views} views
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
