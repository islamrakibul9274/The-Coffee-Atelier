"use client";

import { motion } from "framer-motion";
import ProductCard, { ProductProps } from "./ProductCard";

interface CoffeeGridProps {
  products: ProductProps[];
  loading?: boolean;
}

export default function CoffeeGrid({ products, loading = false }: CoffeeGridProps) {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-cardBorder h-[420px] w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <h3 className="font-serif text-4xl text-foreground italic mb-6">Fresh roasts are on their way.</h3>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Our next shipment is currently undergoing small-batch roasting.</p>
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-14"
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
