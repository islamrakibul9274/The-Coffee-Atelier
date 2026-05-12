"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getClientToken } from "@/lib/firebase/client-utils";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Review {
  _id: string;
  productId: { _id: string; name: string } | string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function MyReviewsPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const token = await getClientToken();
      const res = await fetch(`/api/reviews?firebaseUid=${user?.firebaseUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast.error("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user, fetchReviews]);

  const handleDelete = async (reviewId: string) => {
    try {
      const token = await getClientToken();
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete review");
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Review deleted.");
    } catch {
      toast.error("Could not delete review.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <h1 className="font-outfit text-3xl font-bold text-text-primary mb-8">My Reviews</h1>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-cardBorder rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-outfit text-3xl font-bold text-text-primary mb-8">My Reviews</h1>

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-cardBorder mx-auto mb-4" />
            <p className="font-outfit text-xl text-text-primary mb-1">No reviews yet</p>
            <p className="text-text-secondary text-sm">Share your thoughts on our coffees!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                layout
                className="bg-card border border-cardBorder rounded-2xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary mb-1">
                      {typeof review.productId === "object" ? review.productId.name : "Product"}
                    </p>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "text-accent-amber fill-accent-amber"
                              : "text-cardBorder"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-text-secondary">{review.comment}</p>
                    )}
                    <p className="text-xs text-text-secondary/50 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-2 text-text-secondary hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
