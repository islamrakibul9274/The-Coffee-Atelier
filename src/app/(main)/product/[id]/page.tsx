"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Star, ShoppingBag, ArrowLeft, Clock, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { getClientToken } from "@/lib/firebase/client-utils";

interface Product {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  status: string;
  imageUrl?: string;
  category?: { name: string };
  stock: number;
}

interface Review {
  _id: string;
  firebaseUid: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?productId=${id}`);
      const data = await res.json();
      const found = data.products?.find((p: any) => p._id === id) || data.product;
      setProduct(found || null);
    } catch (error) {
      console.error("Fetch product error:", error);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${id}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

  const handleAddToCart = () => {
    if (!product || product.status !== "active") return;
    
    addItem({
      id: product._id,
      name: product.name,
      price: product.basePrice,
      imageUrl: product.imageUrl,
      quantity: 1,
    });
    
    toast.success("ADDED TO COLLECTION");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("PLEASE LOGIN TO SHARE YOUR EXPERIENCE");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = await getClientToken();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "FAILED TO SUBMIT REVIEW");

      toast.success("REVIEW SUBMITTED");
      setReviewForm({ rating: 5, comment: "" });
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading && !product) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent-gold"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
      <h2 className="font-serif text-3xl text-foreground italic">Curated blend not found.</h2>
      <Link href="/" className="text-accent-gold text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-3">
        <ArrowLeft className="w-4 h-4" /> Return to Collection
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10">
        <Link href="/" className="inline-flex items-center gap-3 text-text-muted hover:text-accent-gold transition-colors mb-16 text-[10px] font-bold uppercase tracking-[0.3em]">
          <ArrowLeft className="w-4 h-4 stroke-[1px]" /> The Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32">
          {/* Product Image */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square bg-card border border-cardBorder overflow-hidden"
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-10 text-4xl font-serif italic">The Atelier</div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.4em]">
                {product.category?.name || "Specialty Selection"}
              </span>
              {averageRating && (
                <div className="flex items-center gap-2 text-accent-gold border-l border-cardBorder pl-4">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-bold tabular-nums">{averageRating}</span>
                </div>
              )}
            </div>

            <h1 className="font-serif text-5xl md:text-7xl text-foreground tracking-tighter leading-[0.9] mb-10">{product.name}</h1>
            <p className="text-text-muted text-base leading-relaxed mb-12 italic font-medium max-w-lg">{product.description}</p>

            <div className="flex items-center gap-12 mb-16">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2">Investment</span>
                <span className="font-serif text-5xl text-foreground italic tracking-tighter tabular-nums">${product.basePrice.toFixed(2)}</span>
              </div>
              <div className="h-12 w-[1px] bg-cardBorder" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2">Availability</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${product.stock > 0 ? "text-accent-gold" : "text-red-400"}`}>
                  {product.stock > 0 ? `${product.stock} Blends remaining` : "Depleted"}
                </span>
              </div>
            </div>

            {product.status === "active" ? (
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full sm:w-auto px-16 py-6 bg-accent-gold text-background text-[11px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-foreground transition-all duration-700 disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1px]" />
                Acquire for Collection
              </button>
            ) : product.status === "coming_soon" ? (
              <div className="p-8 bg-card border border-cardBorder flex items-center gap-6">
                <Clock className="w-6 h-6 text-accent-gold stroke-[1px]" />
                <div>
                  <p className="font-bold text-foreground text-xs uppercase tracking-widest mb-1">Preview Collection</p>
                  <p className="text-[11px] text-text-muted italic">This artisan blend is currently in its final roast profile. Launching soon.</p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-red-500/5 border border-red-500/10 flex items-center gap-6">
                <span className="text-red-400 text-xs font-bold uppercase tracking-widest italic">Inventory Depleted</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-40 pt-40 border-t border-cardBorder">
          <div className="flex items-center gap-4 mb-20">
            <MessageSquare className="w-6 h-6 text-accent-gold stroke-[1px]" />
            <h2 className="font-serif text-3xl md:text-5xl text-foreground leading-tight">Artisan <br /><span className="italic text-accent-gold">Perspectives.</span></h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-40 bg-card border border-cardBorder p-10">
                <h3 className="font-serif text-2xl text-foreground mb-8">Share your thought</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-8">
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 block">Rating</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                          className={`p-3 transition-all duration-500 ${reviewForm.rating >= s ? "text-accent-gold bg-accent-gold/5" : "text-text-muted hover:text-foreground"}`}
                        >
                          <Star className={`w-5 h-5 ${reviewForm.rating >= s ? "fill-current" : "stroke-[1px]"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 block">Narrative</label>
                    <textarea 
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="DESCRIBE YOUR SENSORY EXPERIENCE..."
                      className="w-full h-40 bg-background border border-cardBorder p-6 text-foreground text-sm focus:border-accent-gold outline-none resize-none transition-all placeholder:text-text-muted/20 italic font-medium"
                    />
                  </div>
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-5 bg-background border border-cardBorder text-foreground text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-accent-gold hover:text-background hover:border-accent-gold transition-all duration-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "TRANSMITTING..." : <><Send className="w-4 h-4 stroke-[1px]" /> Post Perspective</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-12">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    key={review._id} 
                    className="border-b border-cardBorder pb-12 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-accent-gold fill-current" : "text-white/5 stroke-[1px]"}`} />
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" /> Authenticated Experience
                          </span>
                          <span className="text-[10px] text-text-muted uppercase tracking-tighter italic">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground text-base leading-loose italic font-medium">{review.comment}</p>
                  </motion.div>
                ))
              ) : (
                <div className="py-32 text-center border border-cardBorder border-dashed">
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.4em] italic">No artisan perspectives yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
