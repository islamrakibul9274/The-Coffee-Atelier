"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle, Coffee } from "lucide-react";

export default function SeedPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/products/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seeding failed");
      setStatus("success");
      setMessage(data.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-cardBorder p-10 text-center space-y-8">
        <div className="w-20 h-20 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto">
          <Coffee className="w-10 h-10 text-accent-gold stroke-[1px]" />
        </div>
        
        <div className="space-y-3">
          <h1 className="font-serif text-3xl text-foreground italic">Inventory Curation</h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Establish the Atelier's Foundation</p>
        </div>

        {status === "idle" && (
          <button 
            onClick={handleSeed}
            className="w-full py-5 bg-accent-gold text-background text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-foreground hover:text-white transition-all duration-700"
          >
            Authorize Seeding
          </button>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest italic">Curating the collection...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4 text-green-400">
              <CheckCircle className="w-10 h-10" />
              <p className="text-[11px] font-bold uppercase tracking-widest">{message}</p>
            </div>
            <button 
              onClick={() => window.location.href = "/"}
              className="w-full py-5 border border-cardBorder text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-cardBorder transition-all duration-500"
            >
              Return to Gallery
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4 text-red-400">
              <AlertCircle className="w-10 h-10" />
              <p className="text-[11px] font-bold uppercase tracking-widest">{message}</p>
            </div>
            <button 
              onClick={handleSeed}
              className="w-full py-5 bg-red-400 text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-red-500 transition-all duration-700"
            >
              Retry Transmission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
