'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string | Date;
  items: OrderItem[];
}

interface AccountViewProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  orders: Order[];
}

export default function AccountView({ user, orders }: AccountViewProps) {
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="pt-36 pb-20 px-6 max-w-5xl mx-auto">
      {/* Account Header */}
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-candela-pink/15 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-4xl md:text-5xl text-candela-charcoal font-light">
                My Account
              </h1>
              {isAdmin ? (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-body font-bold tracking-widest uppercase rounded-full">
                  Admin
                </span>
              ) : (
                <span className="px-3 py-1 bg-candela-pink/20 text-candela-pink-deep text-xs font-body font-bold tracking-widest uppercase rounded-full">
                  Customer
                </span>
              )}
            </div>
            <p className="text-gray-500 font-body text-sm">
              Signed in as <strong className="text-candela-charcoal">{user.name || user.email}</strong> ({user.email})
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <Link href="/admin">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 bg-candela-black text-white font-body text-xs font-bold tracking-widest uppercase rounded-xl hover:bg-candela-charcoal transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>??</span>
                  Admin Dashboard
                </motion.button>
              </Link>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-5 py-2.5 border border-red-200 text-red-600 font-body text-xs font-bold tracking-widest uppercase rounded-xl hover:bg-red-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>?</span>
              Sign Out
            </motion.button>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">??</span>
              <div>
                <p className="font-body text-xs font-bold uppercase tracking-wider text-purple-900">
                  Store Administrator Mode
                </p>
                <p className="font-body text-xs text-purple-700 mt-0.5">
                  You are logged in with your store management credentials. To test the store as a regular customer, click <strong>Sign Out</strong> above and register or sign in with another email.
                </p>
              </div>
            </div>
            <Link href="/admin">
              <button className="whitespace-nowrap px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-purple-700 transition-colors">
                Open Admin ?
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-3xl text-candela-charcoal font-light">Order History</h2>
        <Link href="/track" className="text-xs font-body font-bold text-candela-pink-deep tracking-widest uppercase hover:underline">
          Track an order by number ?
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-14 rounded-3xl shadow-sm text-center border border-candela-pink/15">
          <div className="text-5xl mb-4 opacity-40">???</div>
          <p className="font-display text-2xl text-candela-charcoal mb-2 font-light">
            No orders found for this account
          </p>
          <p className="text-gray-400 font-body text-sm mb-6 max-w-md mx-auto">
            {isAdmin
              ? "As an administrator, your store's customer orders appear in the Admin Dashboard."
              : "When you place orders on Candela, they will appear here with live tracking status."}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/shop">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 bg-candela-pink-deep text-white font-body text-xs font-bold tracking-[0.2em] uppercase rounded-full shadow-md hover:bg-candela-charcoal transition-all"
              >
                Explore Collection
              </motion.button>
            </Link>
            {isAdmin && (
              <Link href="/admin/orders">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3.5 bg-candela-black text-white font-body text-xs font-bold tracking-[0.2em] uppercase rounded-full shadow-md hover:bg-candela-charcoal transition-all"
                >
                  View All Store Orders
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateStr = typeof order.createdAt === 'string'
              ? new Date(order.createdAt).toLocaleDateString()
              : order.createdAt.toLocaleDateString();

            return (
              <div key={order.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-gray-100 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 tracking-widest uppercase mb-1 font-semibold">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400">{dateStr}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 tracking-widest uppercase mb-0.5">Total</p>
                      <p className="font-bold text-candela-charcoal text-lg">{order.total} EGP</p>
                    </div>
                    <span className="px-4 py-2 bg-candela-pink/20 text-candela-pink-deep rounded-full text-xs font-bold tracking-widest uppercase">
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-candela-cream rounded-xl relative overflow-hidden flex-shrink-0">
                        <img src={item.product.image} alt={item.product.name} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-candela-charcoal">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-candela-charcoal">{item.price * item.quantity} EGP</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

