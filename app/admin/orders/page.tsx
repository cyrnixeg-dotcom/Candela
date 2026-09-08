"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import Image from "next/image";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  address: string;
  city: string;
  notes?: string;
  createdAt: string;
  customer: { name: string; phone: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image: string; subcategory: string };
  }[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterStatus
        ? `/api/orders?status=${filterStatus}`
        : "/api/orders";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized: Please make sure you are signed in with an Administrator account.");
        } else {
          setError("Failed to load orders from the server. Please try again.");
        }
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError("Network error while connecting to the server.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customer?.name || "").toLowerCase().includes(q) ||
      (o.customer?.phone || "").toLowerCase().includes(q) ||
      (o.city || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-10 pt-16 lg:pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 300, color: "white", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Orders
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontFamily: "'Jost', sans-serif" }}>
            {orders.length} total orders recorded in store
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-body font-medium flex items-center gap-2 transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          Refresh Orders
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-center justify-between text-xs text-red-200 font-body">
          <span>⚠️ {error}</span>
          <button
            onClick={loadOrders}
            className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, order #, or phone..."
            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl text-xs font-body placeholder-white/30 focus:outline-none focus:border-candela-pink/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterBtn label="All" value="" active={filterStatus === ""} onClick={() => setFilterStatus("")} />
          {ORDER_STATUSES.map((s) => (
            <FilterBtn
              key={s}
              label={getStatusLabel(s)}
              value={s}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Orders table */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/[0.04] rounded-2xl" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Jost', sans-serif", fontSize: "0.9rem" }}>
              {searchQuery ? "No orders match your search query." : "No orders found in this category."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedOrder(order === selectedOrder ? null : order)}
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selectedOrder?.id === order.id
                      ? "rgba(244,167,185,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: selectedOrder?.id === order.id
                      ? "1px solid rgba(244,167,185,0.2)"
                      : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                        {order.customer.name}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                        {order.orderNumber} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.85rem", color: "white", fontWeight: 500 }}>
                      {order.total} EGP
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                      disabled={updatingId === order.id}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer ${getStatusColor(order.status)}`}
                      style={{ background: "transparent" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s} style={{ background: "#1a1a1a", color: "white" }}>
                          {getStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Order detail panel */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, x: 30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "340px" }}
              exit={{ opacity: 0, x: 30, width: 0 }}
              className="flex-shrink-0 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                height: "fit-content",
              }}
            >
              <div className="p-6 space-y-5" style={{ width: "340px" }}>
                <div className="flex items-center justify-between">
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "white" }}>
                    Order Details
                  </h3>
                  <button onClick={() => setSelectedOrder(null)} style={{ color: "rgba(255,255,255,0.3)" }}>✕</button>
                </div>

                <div className="space-y-2">
                  <InfoRow label="Order #" value={selectedOrder.orderNumber} />
                  <InfoRow label="Name" value={selectedOrder.customer.name} />
                  <InfoRow label="Phone" value={selectedOrder.customer.phone} />
                  <InfoRow label="Address" value={`${selectedOrder.address}, ${selectedOrder.city}`} />
                  {selectedOrder.notes && <InfoRow label="Notes" value={selectedOrder.notes} />}
                  <InfoRow label="Total" value={`${selectedOrder.total} EGP`} />
                  <InfoRow label="Date" value={formatDate(selectedOrder.createdAt)} />
                </div>

                <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
                    Items
                  </p>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-12 relative flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.jpg"; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.product.name}
                          </p>
                          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                            × {item.quantity} · {item.price} EGP each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call customer button */}
                <a href={`tel:${selectedOrder.customer.phone}`}>
                  <button
                    className="w-full py-3 text-sm font-medium tracking-widest uppercase transition-colors"
                    style={{ background: "rgba(244,167,185,0.12)", color: "#F4A7B9", borderRadius: "12px", fontFamily: "'Jost', sans-serif", border: "1px solid rgba(244,167,185,0.2)" }}
                  >
                    📞 Call Customer
                  </button>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FilterBtn({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-all"
      style={{
        borderRadius: "100px",
        fontFamily: "'Jost', sans-serif",
        background: active ? "rgba(244,167,185,0.15)" : "rgba(255,255,255,0.04)",
        color: active ? "#F4A7B9" : "rgba(255,255,255,0.4)",
        border: active ? "1px solid rgba(244,167,185,0.3)" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {label}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
