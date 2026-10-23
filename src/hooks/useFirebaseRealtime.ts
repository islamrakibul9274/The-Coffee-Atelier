"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase/client";

export function useActiveBanner() {
  const [banner, setBanner] = useState<{ imageUrl: string; targetUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let receivedRealtime = false;
    let fallback: { imageUrl: string; targetUrl?: string } | null = null;
    const fetchFallback = async () => {
      try {
        const res = await fetch('/api/site-metadata', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        fallback = data.banner || null;
        if (!receivedRealtime) setBanner(fallback);
      } catch { /* The hero has a static image fallback. */ }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    fetchFallback();
    const unsubscribe = onValue(ref(database, 'activeBanner'), snapshot => {
      const data = snapshot.val();
      if (data) { receivedRealtime = true; setBanner(data); }
      else { receivedRealtime = false; setBanner(fallback); }
      setLoading(false);
    }, () => { setLoading(false); });
    return () => { controller.abort(); unsubscribe(); };
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
