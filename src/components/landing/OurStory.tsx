"use client";

import { motion } from "framer-motion";

export default function OurStory() {
  return (
    <section id="our-story" className="py-20 md:py-40 px-6 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-24">
        {/* Left: Decorative Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:w-1/2"
        >
          <span className="text-accent-gold text-[10px] font-bold tracking-[0.6em] uppercase mb-10 inline-block">
            Est. 1994
          </span>
          <h2 className="font-serif text-4xl md:text-7xl text-foreground leading-[0.9] mb-8 md:mb-12">
            A LEGACY OF <br />
            <span className="italic font-normal text-accent-gold">slow roasting.</span>
          </h2>
          <div className="space-y-8 text-text-muted text-sm md:text-base leading-loose font-medium">
            <p>
              Born from a passion for the perfect bean, The Coffee Atelier began as a small boutique roastery in the heart of the city. We believe that coffee is more than just a drink—it’s a moment of clarity, a ritual of comfort, and a celebration of artisan craft.
            </p>
            <p>
              Our process is patient. We source specialty-grade beans from single-origin estates and roast them in small batches to preserve the unique characteristics of every soil and climate.
            </p>
          </div>
          
          <div className="mt-16 flex items-center gap-6">
            <div className="w-12 h-[1px] bg-accent-gold/40" />
            <span className="font-serif text-xl text-foreground italic">Julian Atelier, Founder</span>
          </div>
        </motion.div>

        {/* Right: Abstract Decorative Image / Element */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="md:w-1/2 relative h-[400px] md:h-[700px] w-full"
        >
          <div className="absolute inset-0 bg-card border border-cardBorder translate-x-6 translate-y-6" />
          <div className="absolute inset-0 overflow-hidden border border-accent-gold/20 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80" 
              alt="Artisan Roasting" 
              className="w-full h-full object-cover filter grayscale sepia-[0.3] brightness-75"
            />
          </div>
          
          {/* Accent badge */}
          <div className="absolute -bottom-8 -left-8 w-32 md:w-40 h-32 md:h-40 bg-[#161412] border border-accent-gold/20 flex flex-col items-center justify-center text-foreground text-center shadow-2xl hidden sm:flex">
            <span className="text-[8px] font-bold tracking-[0.4em] uppercase mb-2 text-accent-gold">Quality</span>
            <span className="font-serif text-3xl italic">100%</span>
            <span className="text-[8px] font-bold tracking-[0.4em] uppercase mt-2 text-accent-gold">Arabica</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
