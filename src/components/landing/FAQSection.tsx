"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  { 
    id: "01",
    q: "The Curation Ethos", 
    a: "We navigate the globe to secure the top 1% of specialty-grade beans. Each selection is a direct result of our partnerships with single-origin estates that define excellence in sustainable cultivation. We don't just roast coffee; we preserve a legacy." 
  },
  { 
    id: "02",
    q: "Artisan Subscriptions", 
    a: "Elevate your daily ritual with the Atelier's seasonal selections. Our master roasters curate a rotating collection of our most profound profiles, delivered to your sanctuary precisely when you need them. Luxury, scheduled." 
  },
  { 
    id: "03",
    q: "Exclusive Previews", 
    a: "Members of the Atelier are granted priority access to our experimental micro-lots and limited seasonal releases. These are high-character profiles produced in such small quantities they never reach our public collection." 
  },
  { 
    id: "04",
    q: "Transparent Logistics", 
    a: "From our climate-controlled roastery to your doorstep, every ounce of coffee is tracked with precision. Our real-time timeline ensures you know exactly where your beans are in their journey from flame to cup." 
  },
  { 
    id: "05",
    q: "Secure Transactions", 
    a: "Our boutique commerce experience is underpinned by industry-leading security protocols. We accept all major international credit institutions through a seamless, encrypted gateway, ensuring your peace of mind is absolute." 
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-60 px-6 bg-background relative overflow-hidden">
      {/* Decorative vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-accent-gold/5 hidden lg:block" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-16 md:gap-32 lg:gap-0">
          
          {/* Left: Heading Content */}
          <div className="lg:w-1/2 lg:pr-20 sticky top-40">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <span className="text-accent-gold text-[10px] font-bold tracking-[0.8em] uppercase mb-8 md:mb-12 block">
                The Dialogue
              </span>
              <h2 className="font-serif text-4xl sm:text-6xl md:text-8xl text-foreground leading-[0.85] mb-8 md:mb-16">
                Curated <br />
                <span className="italic text-accent-gold">Clarity.</span>
              </h2>
              <p className="text-text-muted text-base leading-relaxed italic font-medium max-w-sm mb-12">
                Insights into the methodology, logistics, and philosophy that define The Coffee Atelier experience.
              </p>
              
              <div className="flex items-center gap-6">
                <div className="w-12 h-[1px] bg-accent-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-gold">Refining your ritual</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Premium Accordion */}
          <div className="lg:w-1/2 lg:pl-20">
            <div className="border-t border-cardBorder">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-cardBorder group">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-start justify-between py-8 md:py-12 text-left transition-all duration-700"
                  >
                    <div className="flex gap-6 md:gap-16">
                      <span className="font-serif text-sm text-accent-gold/40 mt-1.5 italic tabular-nums">
                        {faq.id}
                      </span>
                      <span className={`font-serif text-2xl md:text-4xl leading-tight transition-all duration-700 ${openIndex === i ? "text-accent-gold italic" : "text-foreground group-hover:text-accent-gold/60"}`}>
                        {faq.q}
                      </span>
                    </div>
                    <div className={`mt-3 transition-transform duration-700 ${openIndex === i ? "rotate-90" : ""}`}>
                      {openIndex === i ? (
                        <Minus className="w-5 h-5 text-accent-gold stroke-[1px]" />
                      ) : (
                        <Plus className="w-5 h-5 text-text-muted group-hover:text-foreground stroke-[1px]" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                      >
                        <div className="pl-14 md:pl-[120px] pb-12 md:pb-16 pr-6 md:pr-10">
                          <p className="text-text-muted text-sm md:text-lg leading-relaxed italic font-medium max-w-xl">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-20 pt-20 border-t border-accent-gold/10"
            >
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-6">Still curious?</p>
              <button className="text-accent-gold hover:text-foreground transition-colors text-sm italic font-serif border-b border-accent-gold pb-1">
                Direct Inquiries →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
