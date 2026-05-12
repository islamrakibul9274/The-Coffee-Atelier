"use client";

import { useEffect, useState, useCallback } from "react";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Package, Truck, CheckCircle, Clock, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CustomSelect from "@/components/ui/CustomSelect";
import { database } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";

interface Order {
  _id: string;
  firebaseUid: string;
  finalTotal: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  items: { product: string; quantity: number; priceAtPurchase: number }[];
}

const statusOpts = ["Pending", "Packaging", "Delivering", "Delivered"];
const statusIcons: Record<string, React.ElementType> = { Pending: Clock, Packaging: Package, Delivering: Truck, Delivered: CheckCircle };
const statusColors: Record<string, string> = { Pending: "text-yellow-400", Packaging: "text-orange-400", Delivering: "text-blue-400", Delivered: "text-[#A3B18A]" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getClientToken();
      const params = new URLSearchParams({ limit: "50", view: "global" });
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setOrders((await res.json()).orders);
    } catch { toast.error("Could not load orders."); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time refresh for new orders
  useEffect(() => {
    const eventRef = ref(database, 'events/new_order');
    const unsubscribe = onValue(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        fetchOrders();
      }
    });
    return () => unsubscribe();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, deliveryStatus: string) => {
    try {
      const token = await getClientToken();
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, deliveryStatus }),
      });
      toast.success(`Status updated to ${deliveryStatus}`);
      fetchOrders();
    } catch { toast.error("Failed to update."); }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-accent-gold" />
        </motion.div>
        <p className="font-playfair italic text-text-secondary tracking-widest animate-pulse">
          Synchronizing the Atelier...
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-outfit text-3xl font-bold text-text-primary">All Orders</h1>
            <p className="text-text-secondary text-sm mt-1">Manage delivery status for every order</p>
          </div>
          <div className="relative">
            <CustomSelect
              value={filter}
              onChange={(val) => { setFilter(val); setLoading(true); }}
              options={[
                { value: "", label: "All Statuses" },
                ...statusOpts.map(s => ({ value: s, label: s }))
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-card border border-cardBorder rounded-2xl h-20" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-card border border-cardBorder rounded-2xl">
            <Package className="w-16 h-16 text-cardBorder mx-auto mb-4" />
            <p className="font-outfit text-lg text-text-primary">No orders found</p>
          </div>
        ) : (
          <div className="bg-card border border-cardBorder rounded-2xl overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cardBorder">
                    <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase">Order</th>
                    <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase">Items</th>
                    <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase">Total</th>
                    <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                    <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase">Date</th>
                    <th className="text-right px-5 py-4 text-xs font-medium text-text-secondary uppercase">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, index) => {
                    const Icon = statusIcons[o.deliveryStatus] || Clock;
                    return (
                      <tr key={o._id} className="border-b border-cardBorder/50 hover:bg-white/[0.02]">
                        <td className="px-5 py-4 text-sm font-medium text-text-primary">#{o._id.slice(-6).toUpperCase()}</td>
                        <td className="px-5 py-4 text-sm text-text-secondary">{(o.items?.length || 0)} items</td>
                        <td className="px-5 py-4 text-sm font-medium text-accent-gold">${o.finalTotal.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusColors[o.deliveryStatus]}`}>
                            <Icon className="w-4 h-4" /> {o.deliveryStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-text-secondary">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end w-32 ml-auto">
                            <CustomSelect
                              value={o.deliveryStatus}
                              onChange={(val) => updateStatus(o._id, val)}
                              options={statusOpts.map(s => ({ value: s, label: s }))}
                              className="w-full"
                              direction={index >= orders.length - 2 ? "up" : "down"}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
