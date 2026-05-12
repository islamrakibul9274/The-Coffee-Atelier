"use client";

import { useActiveBanner } from "@/hooks/useFirebaseRealtime";
import { motion } from "framer-motion";

export default function HeroSection() {
  const { banner, loading } = useActiveBanner();

  return (
    <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-background">
      {/* Background Image - Atmospheric & Warm */}
      {banner?.imageUrl && (
        <motion.div 
          key={banner.imageUrl}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src={banner.imageUrl}
            alt="Hero Banner"
            className="w-full h-full object-cover grayscale brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-60" />
        </motion.div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-40 bg-accent-gold opacity-20" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-20 max-w-5xl"
      >
        <span className="text-accent-gold text-[10px] font-bold tracking-[0.6em] uppercase mb-12 inline-block">
          Artisanal Roastery & Atelier
        </span>
        
        <h1 className="font-serif text-5xl sm:text-6xl md:text-9xl text-foreground tracking-tighter leading-[0.85] mb-10 md:mb-16">
          THE ART OF
          <br />
          <span className="italic font-normal text-accent-gold">fine coffee.</span>
        </h1>
        
        <p className="text-text-muted max-w-md mx-auto text-sm md:text-base mb-20 font-medium leading-relaxed italic">
          Experience the profound depth of slow-roasted specialty beans, curated for the true connoisseur.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center items-center">
          <button
            onClick={() => document.getElementById("menu-grid")?.scrollIntoView({ behavior: "smooth" })}
            className="group relative px-10 sm:px-14 py-5 sm:py-6 bg-accent-gold text-background text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-500 overflow-hidden"
          >
            <span className="relative z-10">The Collection</span>
            <div className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
          
          <button
            onClick={() => document.getElementById("our-story")?.scrollIntoView({ behavior: "smooth" })}
            className="text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/70 hover:text-accent-gold transition-all duration-500 border-b border-accent-gold/20 pb-2"
          >
            Our Narrative
          </button>
        </div>
      </motion.div>

      {/* Bottom vertical line */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: 100 }}
        transition={{ delay: 1.5, duration: 1.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-accent-gold opacity-20" 
      />
    </section>
  );
}
