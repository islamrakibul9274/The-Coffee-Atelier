"use client";

import { useActiveDiscounts } from "@/hooks/useFirebaseRealtime";
import { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import { motion } from "framer-motion";

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(endDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hrs", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-6 justify-center mt-10">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <span className="font-serif text-3xl text-foreground italic tabular-nums">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[8px] font-bold text-accent-gold mt-2 uppercase tracking-[0.2em]">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function FlashDiscounts() {
  const { discounts, loading } = useActiveDiscounts();
  const discountList = Object.entries(discounts).filter(
    ([, d]: [string, any]) => d.endDate && new Date(d.endDate) > new Date()
  );

  if (loading || discountList.length === 0) return null;

  return (
    <section id="flash-deals" className="py-16 md:py-32 px-4 md:px-6 bg-[#0C0B0A] border-y border-cardBorder">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-gold text-[10px] font-bold tracking-[0.6em] uppercase mb-5 inline-block">
            Private Access
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">Member Curations</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-cardBorder border border-cardBorder">
          {discountList.map(([id, d]: [string, any]) => (
            <motion.div
              key={id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-background p-8 md:p-12 text-center group hover:bg-card transition-all duration-700"
            >
              <div className="w-14 h-14 bg-card border border-accent-gold/20 flex items-center justify-center mx-auto mb-10 rounded-full transition-all duration-700 group-hover:border-accent-gold/40">
                <Percent className="w-5 h-5 text-accent-gold stroke-[1px]" />
              </div>

              <h3 className="font-serif text-2xl text-foreground mb-3 italic transition-colors duration-700 group-hover:text-accent-gold">{d.name}</h3>
              <p className="font-serif text-4xl md:text-6xl text-foreground mb-6 tracking-tighter tabular-nums group-hover:scale-110 transition-transform duration-700">
                {d.type === "percentage" ? `${d.value}%` : d.type === "fixed" ? `$${d.value}` : "BOGO"}
              </p>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-10">
                Available for {d.appliesTo?.type || "the entire collection"}
              </p>

              <div className="h-[1px] w-20 bg-accent-gold/10 mx-auto mb-10" />
              
              <CountdownTimer endDate={d.endDate} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
