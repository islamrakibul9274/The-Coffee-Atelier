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
  deliveryStatus: string;
  createdAt: string;
  items: { product: string; quantity: number; priceAtPurchase: number }[];
}

const stages = ["Pending", "Packaging", "Delivering", "Delivered"];
const icons: Record<string, React.ElementType> = { Pending: Clock, Packaging: Package, Delivering: Truck, Delivered: CheckCircle };
const colors: Record<string, string> = { Pending: "text-yellow-400", Packaging: "text-orange-400", Delivering: "text-blue-400", Delivered: "text-[#A3B18A]" };

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getClientToken();
      const params = new URLSearchParams({ limit: "50" });
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
      toast.success(`→ ${deliveryStatus}`);
      fetchOrders();
    } catch { toast.error("Update failed."); }
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
          Consulting the Ledger...
        </p>
      </div>
    );
  }

  const nextStage = (current: string) => {
    const idx = stages.indexOf(current);
    return idx < stages.length - 1 ? stages[idx + 1] : null;
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-outfit text-3xl font-bold text-text-primary">Order Fulfillment</h1>
            <p className="text-text-secondary text-sm mt-1">Update delivery stages for customer orders</p>
          </div>
          <div className="relative">
            <CustomSelect
              value={filter}
              onChange={(val) => setFilter(val)}
              options={[
                { value: "", label: "All Stages" },
                ...stages.map(s => ({ value: s, label: s }))
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-card border border-cardBorder rounded-2xl h-24" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-card border border-cardBorder rounded-2xl">
            <Package className="w-16 h-16 text-cardBorder mx-auto mb-4" />
            <p className="font-outfit text-lg text-text-primary">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const Icon = icons[o.deliveryStatus] || Clock;
              const next = nextStage(o.deliveryStatus);
              return (
                <div key={o._id} className="bg-card border border-cardBorder rounded-2xl p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${o.deliveryStatus === "Delivered" ? "bg-[#A3B18A]/10" : "bg-white/5"}`}>
                    <Icon className={`w-5 h-5 ${colors[o.deliveryStatus]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-text-primary">#{o._id.slice(-6).toUpperCase()}</span>
                      <span className={`text-xs font-medium ${colors[o.deliveryStatus]}`}>{o.deliveryStatus}</span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {o.items.length} item{o.items.length !== 1 && "s"} · ${o.finalTotal.toFixed(2)} · {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* Quick-advance button */}
                  {next ? (
                    <button onClick={() => updateStatus(o._id, next)}
                      className="px-4 py-2 bg-accent-gold/10 text-accent-gold text-xs font-bold rounded-xl hover:bg-accent-gold/20 transition-colors flex-shrink-0">
                      → {next}
                    </button>
                  ) : (
                    <span className="text-xs text-[#A3B18A] font-bold px-4 py-2 bg-[#A3B18A]/10 rounded-xl flex-shrink-0">✓ Done</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
