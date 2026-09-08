"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  createdAt: string;
  totalSpend: number;
  _count: { orders: number };
  orders: { orderNumber: string; total: number; status: string; createdAt: string }[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        setError("Failed to load customers.");
        setCustomers([]);
        return;
      }
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      setError("Network error while connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Customers
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'Jost', sans-serif" }}>
            {customers.length} registered customers & order placers
          </p>
        </div>

        <button
          onClick={loadCustomers}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-body font-medium flex items-center gap-2 transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-center justify-between text-xs text-red-200 font-body">
          <span>⚠️ {error}</span>
          <button onClick={loadCustomers} className="px-3 py-1 bg-red-900 text-white rounded-lg text-xs font-bold">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, email, or phone..."
          className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl text-xs font-body placeholder-white/30 focus:outline-none focus:border-candela-pink/50"
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Customer", "Contact", "Orders", "Total Spent", "Last Order", "Joined"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(255,255,255,0.02)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <div style={{ height: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : filteredCustomers.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                        {customer.name}
                      </p>
                      {customer.email && (
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                          {customer.email}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <a href={`tel:${customer.phone}`} style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "rgba(244,167,185,0.7)" }}>
                        {customer.phone}
                      </a>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "white" }}>
                        {customer._count.orders}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.85rem", color: "#86EFAC", fontWeight: 500 }}>
                        {customer.totalSpend} EGP
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                        {customer.orders[0] ? formatDate(customer.orders[0].createdAt) : "—"}
                      </p>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                        {formatDate(customer.createdAt)}
                      </p>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
        {!loading && filteredCustomers.length === 0 && (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontFamily: "'Jost', sans-serif", fontSize: "0.9rem" }}>
            {searchQuery ? "No customers match your search." : "No customers found."}
          </div>
        )}
      </div>
    </div>
  );
}
