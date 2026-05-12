"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getClientToken } from "@/lib/firebase/client-utils";

export default function DemoPaymentPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    name: ""
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push("/");
    }
  }, [items, router]);

  const fillDemoData = () => {
    setFormData({
      cardNumber: "4242 4242 4242 4242",
      expiry: "12/28",
      cvc: "123",
      name: user?.name || "Artisan Connoisseur"
    });
    toast.success("DEMO CREDENTIALS LOADED", {
      icon: "✨",
      style: {
        background: "#0F0D0C",
        color: "#C0A080",
        border: "1px solid #C0A080",
        fontSize: "10px",
        fontWeight: "bold",
        letterSpacing: "0.2em"
      }
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const token = await getClientToken();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          subtotal: getTotalPrice(),
          finalTotal: getTotalPrice(),
          stripeSessionId: `demo_${Date.now()}`
        })
      });

      if (!res.ok) throw new Error("ACQUISITION AUTHORIZATION FAILED");

      // Simulate payment processing delay for cinematic effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsProcessing(false);
      toast.success("TRANSACTION AUTHORIZED");
      const { order } = await res.json();
      clearCart();
      router.push(`/order/success?session_id=${order.stripeSessionId}`);
    } catch (error: any) {
      toast.error(error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-3 text-text-muted hover:text-accent-gold transition-colors mb-16 text-[10px] font-bold uppercase tracking-[0.3em]">
          <ArrowLeft className="w-4 h-4 stroke-[1px]" /> Return to Atelier
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left: Summary */}
          <div className="space-y-12">
            <div>
              <span className="text-accent-gold text-[10px] font-bold tracking-[0.6em] uppercase mb-6 block italic">Checkout Mode</span>
              <h1 className="font-serif text-5xl text-foreground leading-tight">Demo <br /><span className="italic text-accent-gold">Acquisition.</span></h1>
            </div>

            <div className="bg-card border border-cardBorder p-10 space-y-8">
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-text-muted font-medium uppercase tracking-widest">{item.name} <span className="text-accent-gold/40 italic">x{item.quantity}</span></span>
                    <span className="text-foreground font-bold tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-cardBorder flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted">Total Investment</span>
                <span className="font-serif text-4xl text-foreground italic tabular-nums">${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 border border-accent-gold/10 bg-accent-gold/5">
              <ShieldCheck className="w-5 h-5 text-accent-gold stroke-[1px]" />
              <p className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em]">Sandbox Mode Active — No real funds will be deducted.</p>
            </div>
          </div>

          {/* Right: Mock Form */}
          <div className="bg-card border border-cardBorder p-12">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                <CreditCard className="w-5 h-5 text-accent-gold stroke-[1px]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Payment Details</span>
              </div>
              <button 
                onClick={fillDemoData}
                className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent-gold border border-accent-gold/20 px-4 py-2 hover:bg-accent-gold hover:text-background transition-all duration-500 flex items-center gap-2"
              >
                <Sparkles className="w-3 h-3" /> Use Demo Data
              </button>
            </div>

            <form onSubmit={handlePayment} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Cardholder Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background border border-cardBorder p-5 text-sm text-foreground focus:border-accent-gold outline-none transition-all placeholder:text-text-muted/20"
                  placeholder="E.G. JULIAN ATELIER"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Card Number</label>
                <input 
                  required
                  type="text"
                  value={formData.cardNumber}
                  onChange={e => setFormData({...formData, cardNumber: e.target.value})}
                  className="w-full bg-background border border-cardBorder p-5 text-sm text-foreground focus:border-accent-gold outline-none transition-all tabular-nums"
                  placeholder="0000 0000 0000 0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Expiry</label>
                  <input 
                    required
                    type="text"
                    value={formData.expiry}
                    onChange={e => setFormData({...formData, expiry: e.target.value})}
                    className="w-full bg-background border border-cardBorder p-5 text-sm text-foreground focus:border-accent-gold outline-none transition-all tabular-nums"
                    placeholder="MM / YY"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">CVC</label>
                  <input 
                    required
                    type="text"
                    value={formData.cvc}
                    onChange={e => setFormData({...formData, cvc: e.target.value})}
                    className="w-full bg-background border border-cardBorder p-5 text-sm text-foreground focus:border-accent-gold outline-none transition-all tabular-nums"
                    placeholder="000"
                  />
                </div>
              </div>

              <button 
                disabled={isProcessing}
                type="submit"
                className="w-full py-6 bg-foreground text-background text-[11px] font-bold uppercase tracking-[0.5em] hover:bg-accent-gold transition-all duration-700 flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AUTHORIZING...
                  </>
                ) : (
                  <>
                    AUTHORIZE ACQUISITION
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-[8px] text-text-muted uppercase tracking-[0.4em] italic">
              Encrypted transmission powered by the Atelier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
