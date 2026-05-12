"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Coffee, Tag, ArrowRight } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";

interface SearchResult {
  id: string;
  name: string;
  type: "product" | "category";
  price?: number;
  imageUrl?: string;
  slug?: string;
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [fuse, setFuse] = useState<Fuse<SearchResult> | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products?limit=100"),
          fetch("/api/categories")
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        const combined: SearchResult[] = [
          ...prodData.products.map((p: any) => ({
            id: p._id,
            name: p.name,
            type: "product",
            price: p.basePrice,
            imageUrl: p.imageUrl
          })),
          ...catData.categories.map((c: any) => ({
            id: c._id,
            name: c.name,
            type: "category",
            slug: c.slug
          }))
        ];

        setFuse(new Fuse(combined, {
          keys: ["name"],
          threshold: 0.3,
        }));
      } catch (error) {
        console.error("Search index error:", error);
      }
    };

    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (fuse && query) {
      const searchResults = fuse.search(query).map(r => r.item);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [query, fuse]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 sm:pt-32">
          {/* Backdrop - High-End Dark Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Content - The Coffee Atelier Dark Style */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-2xl bg-card border border-cardBorder shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center px-5 sm:px-10 py-6 sm:py-10 border-b border-cardBorder bg-background">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-accent-gold mr-4 sm:mr-8 stroke-[1px]" />
              <input 
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="DISCOVER..."
                className="flex-1 bg-transparent border-none text-foreground placeholder:text-text-muted focus:ring-0 text-xl sm:text-3xl font-serif italic outline-none"
              />
              <button onClick={onClose} className="p-2 hover:bg-card rounded-full transition-colors">
                <X className="w-6 h-6 sm:w-8 sm:h-8 text-foreground stroke-[1px]" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto px-5 sm:px-10 py-6 sm:py-10">
              {query === "" ? (
                <div className="py-24 text-center opacity-40">
                  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-text-muted italic">Awaiting your inquiry...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result) => (
                    <Link 
                      key={`${result.type}-${result.id}`}
                      href={result.type === "product" ? `/product/${result.id}` : `/?category=${result.id}#menu-grid`}
                      onClick={onClose}
                      className="flex items-center p-4 sm:p-6 bg-background border border-cardBorder hover:border-accent-gold/40 transition-all duration-500 group"
                    >
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-card border border-cardBorder flex items-center justify-center mr-4 sm:mr-8 flex-shrink-0 overflow-hidden">
                        {result.type === "product" ? (
                          result.imageUrl ? (
                            <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover grayscale-[0.6] group-hover:grayscale-0 transition-all duration-700" />
                          ) : (
                            <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-accent-gold stroke-[0.5px]" />
                          )
                        ) : (
                          <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-text-muted stroke-[0.5px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg sm:text-2xl text-foreground group-hover:text-accent-gold transition-colors truncate">{result.name}</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mt-1 sm:mt-2 italic group-hover:text-foreground">
                          {result.type} {result.price && `• $${result.price.toFixed(2)}`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-500" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center opacity-40">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted italic">No curations matched your search.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-10 py-6 border-t border-cardBorder bg-background flex justify-between items-center">
              <div className="flex gap-10">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted flex items-center">
                  <span className="bg-card border border-cardBorder px-2 py-0.5 mr-3 text-foreground rounded-sm">ESC</span> 
                  Dismiss
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted flex items-center">
                  <span className="bg-card border border-cardBorder px-2 py-0.5 mr-3 text-foreground rounded-sm">ENTER</span> 
                  Select
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
