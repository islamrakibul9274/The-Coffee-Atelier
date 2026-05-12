"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCartStore, CartItem } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getClientToken } from "@/lib/firebase/client-utils";
import toast from "react-hot-toast";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Handle hydration to prevent SSR mismatch and ensure persistence works
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("PLEASE SIGN IN TO COMPLETE YOUR COLLECTION.");
      return;
    }
    setLoading(true);
    try {
      const token = await getClientToken();
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "CHECKOUT INITIALIZATION FAILED");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("SECURE LINK NOT GENERATED");
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast.error(error.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-cardBorder shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 sm:px-10 py-6 sm:py-10 border-b border-cardBorder flex items-center justify-between bg-card">
              <div className="flex items-center gap-5">
                <ShoppingBag className="w-5 h-5 text-accent-gold stroke-[1px]" />
                <h2 className="font-serif text-xl sm:text-2xl text-foreground italic">Your Collection</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors">
                <X className="w-6 h-6 text-foreground stroke-[1px]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 sm:py-10 space-y-6 sm:space-y-10">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 mb-6 sm:mb-8 stroke-[0.5px] text-text-muted" />
                  <p className="font-serif text-xl sm:text-2xl italic text-foreground">Your collection is empty.</p>
                  <button
                    onClick={onClose}
                    className="mt-8 sm:mt-10 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] text-accent-gold border-b border-accent-gold/20 pb-2 hover:border-accent-gold transition-all"
                  >
                    Begin Curation
                  </button>
                </div>
              ) : (
                items.map((item: CartItem) => (
                  <div key={item.id} className="flex gap-4 sm:gap-8 group">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-card border border-cardBorder flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] sm:text-[10px] text-text-muted italic text-center px-2">Atelier Roast</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 sm:py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                          <h3 className="font-serif text-lg sm:text-xl text-foreground leading-tight truncate pr-4 group-hover:text-accent-gold transition-colors">{item.name}</h3>
                          <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1px]" />
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-accent-gold tabular-nums tracking-tighter">${item.price.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center border border-cardBorder w-fit mt-2 sm:mt-0">
                        <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1.5 sm:p-2 hover:bg-card transition-colors">
                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-muted" />
                        </button>
                        <span className="w-8 sm:w-10 text-center text-[10px] sm:text-xs font-bold tabular-nums text-foreground">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 sm:p-2 hover:bg-card transition-colors">
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-muted" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 sm:px-10 py-8 sm:py-12 bg-card border-t border-cardBorder">
                <div className="flex justify-between items-end mb-6 sm:mb-10">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.5em] text-text-muted block mb-1 sm:mb-2">Total Value</span>
                    <span className="font-serif text-3xl sm:text-5xl text-foreground italic tracking-tighter tabular-nums">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-6 bg-accent-gold text-background text-[11px] font-bold uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:bg-foreground transition-all duration-700 disabled:opacity-50 shadow-2xl"
                >
                  {loading ? "PROCESSING..." : (
                    <>
                      SECURE CHECKOUT
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <Link
                  href="/order/demo-payment"
                  onClick={onClose}
                  className="w-full mt-4 py-4 border border-cardBorder text-foreground text-[9px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-card transition-all duration-500"
                >
                  <Sparkles className="w-4 h-4 text-accent-gold" />
                  USE DEMO ACQUISITION
                </Link>
                <p className="text-center mt-8 text-[9px] font-medium text-text-muted uppercase tracking-[0.3em] italic">
                  Curated exclusively by The Coffee Atelier
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
