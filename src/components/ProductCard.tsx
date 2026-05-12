"use client";

import { motion } from "framer-motion";
import { Plus, Eye } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";
import Link from "next/link";

export interface ProductProps {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  status?: string;
}

export default function ProductCard({ product }: { product: ProductProps }) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product._id,
      name: product.name,
      price: product.basePrice,
      imageUrl: product.imageUrl || "",
      quantity: 1,
    });
    
    toast.success(`${product.name.toUpperCase()} ADDED`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col"
    >
      {/* Image Wrapper */}
      <div className="relative aspect-[4/5] overflow-hidden bg-card border border-cardBorder mb-10">
        <Link href={`/product/${product._id}`} className="block w-full h-full">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800";
              }}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 filter grayscale-[0.4] brightness-75 group-hover:grayscale-0 group-hover:brightness-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted italic font-serif">
              Atelier Selection
            </div>
          )}
        </Link>
        
        {/* Hover Action */}
        <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
            <Link
              href={`/product/${product._id}`}
              className="w-14 h-14 bg-background text-foreground border border-cardBorder rounded-full flex items-center justify-center shadow-2xl scale-90 hover:scale-100 transition-all duration-700 hover:bg-accent-gold hover:text-background"
              title="View Details"
            >
              <Eye className="w-6 h-6 stroke-[1px]" />
            </Link>
            <button
              onClick={handleAddToCart}
              className="w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-2xl scale-90 hover:scale-100 transition-all duration-700 hover:bg-accent-gold"
              title="Add to Collection"
            >
              <Plus className="w-6 h-6 stroke-[1px]" />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        {product.status === "coming_soon" && (
          <div className="absolute top-6 left-6 bg-accent-gold text-background text-[9px] font-bold uppercase tracking-[0.4em] px-4 py-1.5">
            Private Preview
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <Link href={`/product/${product._id}`}>
          <h3 className="font-serif text-2xl text-foreground mb-3 transition-colors group-hover:text-accent-gold duration-700">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-6 mb-5">
          <div className="h-[1px] w-12 bg-accent-gold/10" />
          <span className="text-base font-bold text-accent-gold tabular-nums tracking-tighter">${product.basePrice.toFixed(2)}</span>
          <div className="h-[1px] w-12 bg-accent-gold/10" />
        </div>
        <p className="text-[10px] text-text-muted font-medium uppercase tracking-[0.2em] line-clamp-1 max-w-[220px] mx-auto transition-colors duration-700 group-hover:text-foreground">
          {product.description || "A masterfully curated artisan roast"}
        </p>
      </div>
    </motion.div>
  );
}
