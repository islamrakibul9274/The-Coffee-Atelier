"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import CoffeeGrid from "@/components/CoffeeGrid";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronRight, ChevronLeft } from "lucide-react";

interface Category { _id: string; name: string; slug: string; }

const ITEMS_PER_PAGE = 8;

export default function MenuSection() {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number>(100); // Increased max price for premium items
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?limit=100&status=active`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAllProducts(data.products);
    } catch { setAllProducts([]); }
    finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error();
      setCategories((await res.json()).categories);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { 
    fetchCategories(); 
    fetchProducts(); 
  }, [fetchCategories, fetchProducts]);

  // Derived filtered products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p: any) => {
      const matchesCategory = activeCategory === "" || p.category?._id === activeCategory;
      const matchesPrice = p.basePrice <= priceRange;
      return matchesCategory && matchesPrice;
    });
  }, [allProducts, activeCategory, priceRange]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [activeCategory, priceRange]);

  return (
    <section id="menu-grid" className="py-20 md:py-40 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-40">
              <span className="text-accent-gold text-[10px] font-bold tracking-[0.4em] uppercase mb-10 block italic">
                Curation Filters
              </span>
              
              {/* Category Filter */}
              <div className="mb-16">
                <h3 className="font-serif text-2xl text-foreground mb-8 italic">Collections</h3>
                <div className="flex flex-col gap-5">
                  <button
                    onClick={() => setActiveCategory("")}
                    className={`text-left text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${
                      activeCategory === "" ? "text-accent-gold translate-x-2" : "text-text-muted hover:text-foreground"
                    }`}
                  >
                    All Blends
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setActiveCategory(c._id)}
                      className={`text-left text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${
                        activeCategory === c._id ? "text-accent-gold translate-x-2" : "text-text-muted hover:text-foreground"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <div className="flex justify-between items-end mb-8">
                  <h3 className="font-serif text-2xl text-foreground italic">Price Limit</h3>
                  <span className="text-xs font-bold text-accent-gold tabular-nums">${priceRange}</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="5"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-[1px] bg-cardBorder appearance-none cursor-pointer accent-accent-gold"
                />
                <div className="flex justify-between mt-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                  <span>$10</span>
                  <span>$100</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <header className="mb-12 md:mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
              <div className="max-w-xl">
                <span className="text-accent-gold text-[10px] font-bold tracking-[0.6em] uppercase mb-4 sm:mb-6 block">
                  The Curation
                </span>
                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground leading-tight">Artisanal <br /><span className="italic text-accent-gold">Gallery.</span></h2>
              </div>
              
              {/* Mobile Filter Toggle */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-4 px-8 py-4 border border-cardBorder text-[10px] font-bold uppercase tracking-[0.3em] text-foreground"
              >
                <Filter className="w-4 h-4 stroke-[1px]" />
                Refine
              </button>
            </header>

            <div className="min-h-[400px] md:min-h-[800px]">
              <CoffeeGrid products={paginatedProducts} loading={loading} />
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-16 md:mt-28 flex items-center justify-center gap-6 md:gap-10">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-4 border border-cardBorder text-text-muted hover:text-accent-gold disabled:opacity-20 transition-all duration-500"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[1px]" />
                </button>
                
                <div className="flex items-center gap-6">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${
                        currentPage === i + 1 ? "text-accent-gold border-b border-accent-gold pb-1" : "text-text-muted hover:text-foreground"
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-4 border border-cardBorder text-text-muted hover:text-accent-gold disabled:opacity-20 transition-all duration-500"
                >
                  <ChevronRight className="w-5 h-5 stroke-[1px]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-xs bg-card border-l border-cardBorder z-[101] lg:hidden p-12 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-16">
                <span className="text-accent-gold text-[10px] font-bold tracking-[0.4em] uppercase italic">Refinement</span>
                <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-foreground stroke-[1px]" /></button>
              </div>

              <div className="space-y-16">
                <div>
                  <h3 className="font-serif text-3xl text-foreground mb-8 italic">Collections</h3>
                  <div className="flex flex-col gap-6">
                    <button
                      onClick={() => { setActiveCategory(""); setIsSidebarOpen(false); }}
                      className={`text-left text-[11px] font-bold uppercase tracking-[0.2em] ${activeCategory === "" ? "text-accent-gold" : "text-text-muted"}`}
                    >
                      All Blends
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => { setActiveCategory(c._id); setIsSidebarOpen(false); }}
                        className={`text-left text-[11px] font-bold uppercase tracking-[0.2em] ${activeCategory === c._id ? "text-accent-gold" : "text-text-muted"}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-8">
                    <h3 className="font-serif text-3xl text-foreground italic">Price</h3>
                    <span className="text-sm font-bold text-accent-gold">${priceRange}</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-[1px] bg-background border border-cardBorder appearance-none cursor-pointer accent-accent-gold"
                  />
                </div>

                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-full py-5 bg-accent-gold text-background text-[11px] font-bold uppercase tracking-[0.4em]"
                >
                  Apply Selection
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
