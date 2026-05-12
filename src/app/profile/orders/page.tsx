"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { database } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";

interface OrderTimeline {
  status: string;
  timestamp: string;
}

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  finalTotal: number;
  status: string;
  deliveryStatus: string;
  timeline: OrderTimeline[];
  createdAt: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  Pending: { icon: Clock, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  Packaging: { icon: Package, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  Delivering: { icon: Truck, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  Delivered: { icon: CheckCircle, color: "text-[#A3B18A]", bgColor: "bg-[#A3B18A]/10" },
};

export default function MyOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getClientToken();
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch (error: any) {
      toast.error("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // Real-time listener for order status changes
  useEffect(() => {
    if (!user?.firebaseUid) return;

    const ordersRef = ref(database, `orders/${user.firebaseUid}`);
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const firebaseOrders = snapshot.val();
        setOrders(prevOrders => prevOrders.map(order => {
          const updated = firebaseOrders[order._id];
          if (updated && updated.deliveryStatus !== order.deliveryStatus) {
            return { ...order, deliveryStatus: updated.deliveryStatus };
          }
          return order;
        }));
      }
    });

    return () => unsubscribe();
  }, [user?.firebaseUid]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <h1 className="font-outfit text-3xl font-bold text-text-primary mb-8">My Orders</h1>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-cardBorder rounded-2xl h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-outfit text-3xl font-bold text-text-primary mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-cardBorder mx-auto mb-4" />
            <p className="font-outfit text-xl text-text-primary mb-1">No orders yet</p>
            <p className="text-text-secondary text-sm">Your coffee journey starts with one click.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isExpanded={expandedOrder === order._id}
                onToggle={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = statusConfig[order.deliveryStatus] || statusConfig.Pending;
  const StatusIcon = config.icon;
  const deliveryStages = ["Packaging", "Delivering", "Delivered"];
  const currentStageIndex = deliveryStages.indexOf(order.deliveryStatus);

  return (
    <motion.div layout className="bg-card border border-cardBorder rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-text-primary">
              Order #{order._id.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-text-secondary">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-outfit text-lg font-bold text-accent-gold">
            ${order.finalTotal.toFixed(2)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-cardBorder pt-5">
              {/* Delivery Timeline */}
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">
                  Delivery Progress
                </p>
                <div className="flex items-center justify-between">
                  {deliveryStages.map((stage, index) => {
                    const stageConfig = statusConfig[stage];
                    const Icon = stageConfig.icon;
                    const isComplete = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    return (
                      <div key={stage} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              isComplete
                                ? `${stageConfig.bgColor} border-2 ${isCurrent ? 'border-current' : 'border-transparent'}`
                                : "bg-white/5 border border-cardBorder"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isComplete ? stageConfig.color : "text-cardBorder"}`} />
                          </div>
                          <span className={`text-xs mt-2 ${isComplete ? "text-text-primary" : "text-text-secondary/50"}`}>
                            {stage}
                          </span>
                        </div>
                        {index < deliveryStages.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-2 rounded ${index < currentStageIndex ? "bg-accent-gold" : "bg-cardBorder"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                  Items
                </p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-text-secondary">
                        {item.name || 'Product'} × {item.quantity}
                      </span>
                      <span className="text-text-primary">${item.priceAtPurchase.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1 pt-3 border-t border-cardBorder">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-[#A3B18A]">-${order.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent-gold">${order.finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
