"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase/client";

export function useActiveBanner() {
  const [banner, setBanner] = useState<{ imageUrl: string; targetUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bannerRef = ref(database, 'activeBanner');
    
    // Fallback: Fetch directly from MongoDB if RTDB is empty/fail
    const fetchFallback = async () => {
      try {
        const res = await fetch('/api/site-metadata');
        const data = await res.json();
        if (data.banner && !banner) {
          setBanner(data.banner);
        }
      } catch (err) {
        console.error('Banner Fallback Failed:', err);
      }
    };

    fetchFallback();

    const unsubscribe = onValue(bannerRef, (snapshot) => {
      const data = snapshot.val();
      setBanner(data || null);
      setLoading(false);
    }, (error) => {
      console.error("Firebase RTDB Banner Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { banner, loading };
}

export function useActiveDiscounts() {
  const [discounts, setDiscounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const discountsRef = ref(database, 'activeDiscounts');
    const unsubscribe = onValue(discountsRef, (snapshot) => {
      const data = snapshot.val();
      setDiscounts(data || {});
      setLoading(false);
    }, (error) => {
      console.error("Firebase RTDB Discounts Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { discounts, loading };
}

export function useLatestAnnouncement() {
  const [announcement, setAnnouncement] = useState<{ title: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const announcementRef = ref(database, 'announcements/latest');
    const unsubscribe = onValue(announcementRef, (snapshot) => {
      const data = snapshot.val();
      setAnnouncement(data || null);
      setLoading(false);
    }, (error) => {
      console.error("Firebase RTDB Announcement Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { announcement, loading };
}
