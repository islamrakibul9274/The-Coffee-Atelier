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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-cardBorder h-[550px] w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <h3 className="font-serif text-4xl text-foreground italic mb-6">Inventory Depleted</h3>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Our next shipment is currently undergoing small-batch roasting.</p>
      </div>
    );
  }

  return (
    <div 
      id="menu-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-28"
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
