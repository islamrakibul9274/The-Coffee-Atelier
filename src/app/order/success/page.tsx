"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Package } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { getClientToken } from "@/lib/firebase/client-utils";

import toast from "react-hot-toast";
import { Suspense } from "react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const finalizeOrder = async () => {
      if (sessionId && !cleared && !error) {
        try {
          const token = await getClientToken();
          const res = await fetch("/api/orders/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
          });
          
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Verification failed");
          }

          clearCart();
          setCleared(true);
        } catch (err: any) {
          console.error("Order finalization failed:", err);
          setError(err.message);
          toast.error("COULD NOT SYNC ATELIER RECORDS: " + err.message);
        }
      }
    };
    finalizeOrder();
  }, [sessionId, cleared, clearCart, error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </motion.div>

        <h1 className="font-outfit text-3xl font-bold text-text-primary mb-3">
          {cleared ? "Order Confirmed!" : "Finalizing Collection..."}
        </h1>
        <p className="text-text-secondary mb-2">
          {cleared 
            ? "Thank you for your purchase. Your premium coffee is being prepared."
            : "Synchronizing your acquisition with the Atelier's records."}
        </p>
        {sessionId && (
          <p className="text-xs text-text-secondary/60 mb-8 font-mono">
            Session: {sessionId.slice(0, 20)}...
          </p>
        )}

        <div className="bg-card border border-cardBorder rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-accent-gold" />
            <span className="font-outfit font-bold text-text-primary">What&apos;s Next?</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1 text-center">
              <div className="w-8 h-8 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center mx-auto mb-1 text-xs font-bold">1</div>
              <span className="text-text-secondary">Packaging</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cardBorder flex-shrink-0" />
            <div className="flex-1 text-center">
              <div className="w-8 h-8 rounded-full bg-white/5 text-text-secondary flex items-center justify-center mx-auto mb-1 text-xs font-bold">2</div>
              <span className="text-text-secondary">Delivering</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cardBorder flex-shrink-0" />
            <div className="flex-1 text-center">
              <div className="w-8 h-8 rounded-full bg-white/5 text-text-secondary flex items-center justify-center mx-auto mb-1 text-xs font-bold">3</div>
              <span className="text-text-secondary">Delivered</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profile/orders"
            className={`flex-1 py-3 px-6 bg-accent-gold text-background font-bold rounded-xl hover:bg-accent-amber transition-all text-center ${!cleared ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {!cleared ? "Verifying..." : "Track My Orders"}
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 px-6 bg-card border border-cardBorder text-text-primary font-medium rounded-xl hover:bg-white/5 transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-accent-gold font-outfit text-xl">Loading Atelier Records...</div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
