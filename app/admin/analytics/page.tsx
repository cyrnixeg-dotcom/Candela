"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<{
    stats: {
      totalOrders: number;
      pendingOrders: number;
      confirmedOrders: number;
      deliveredOrders: number;
      totalCustomers: number;
      totalProducts: number;
      totalRevenue: number;
      conversionRate: string;
    };
    topProducts: { id: string; name: string; views: number; subcategory: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const STATUS_DATA = data?.stats
    ? [
        { label: "Pending", value: data.stats.pendingOrders, color: "#FCD34D" },
        { label: "Confirmed", value: data.stats.confirmedOrders, color: "#93C5FD" },
        { label: "Delivered", value: data.stats.deliveredOrders, color: "#86EFAC" },
      ]
    : [];

  const total = STATUS_DATA.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10">
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em", marginBottom: "8px" }}>
        Analytics
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'Jost', sans-serif", marginBottom: "32px" }}>
        Real data from your store
      </p>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Revenue", value: loading ? "—" : `${data?.stats.totalRevenue?.toLocaleString() || 0} EGP`, color: "#86EFAC" },
          { label: "Total Orders", value: loading ? "—" : data?.stats.totalOrders, color: "#F4A7B9" },
          { label: "Customers", value: loading ? "—" : data?.stats.totalCustomers, color: "#93C5FD" },
          { label: "Conversion Rate", value: loading ? "—" : `${data?.stats.conversionRate || 0}%`, color: "#FCD34D" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="p-6 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="w-2 h-2 rounded-full mb-3" style={{ background: metric.color }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "white", fontWeight: 500 }}>
              {metric.value}
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px" }}>
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "white", marginBottom: "24px" }}>
            Order Status Breakdown
          </h2>
          <div className="space-y-5">
            {STATUS_DATA.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "white" }}>{s.value}</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.value / total) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ height: "100%", background: s.color, borderRadius: "3px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "white", marginBottom: "24px" }}>
            Most Viewed Products
          </h2>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
              ))
            ) : data?.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "rgba(244,167,185,0.3)", width: "20px", textAlign: "center" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginBottom: "6px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.topProducts[0]?.views > 0 ? (p.views / data.topProducts[0].views) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                      style={{ height: "100%", background: "#F4A7B9", borderRadius: "3px" }}
                    />
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </p>
                </div>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.75rem", color: "rgba(244,167,185,0.6)", flexShrink: 0 }}>
                  {p.views} views
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
