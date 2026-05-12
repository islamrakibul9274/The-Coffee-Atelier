"use client";

import { useState, useEffect } from "react";
import { Bell, Package, Truck, CheckCircle, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase/client";
import Link from "next/link";

export default function NotificationsDropdown() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Guest view: Only listen to global announcements
    // Logged in view: Listen to both personal order updates and global announcements
    const orderNotificationsRef = user ? ref(database, `notifications/${user.firebaseUid}`) : null;
    const globalAnnouncementsRef = ref(database, `announcements/latest`);

    let currentOrders: any[] = [];
    let currentAnnouncement: any = null;

    const updateList = () => {
      const list = [...currentOrders];
      if (currentAnnouncement) {
        list.push({
          id: 'announcement',
          type: 'announcement',
          title: currentAnnouncement.title,
          message: currentAnnouncement.message,
          timestamp: currentAnnouncement.timestamp || Date.now(),
          read: false,
        });
      }
      
      const sorted = list.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(sorted);
      setUnreadCount(sorted.filter((n) => !n.read).length);
    };

    // Fallback: Fetch latest announcement from MongoDB if RTDB is taking too long or empty
    const fetchFallback = async () => {
      try {
        const res = await fetch('/api/site-metadata');
        const data = await res.json();
        if (data.announcement && !currentAnnouncement) {
          currentAnnouncement = {
            ...data.announcement,
            timestamp: new Date(data.announcement.createdAt).getTime()
          };
          updateList();
        }
      } catch (err) {
        console.error('Metadata Fallback Failed:', err);
      }
    };

    fetchFallback();

    const unsubAnnouncements = onValue(globalAnnouncementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        currentAnnouncement = {
          ...data,
          timestamp: data.timestamp || Date.now()
        };
      } else if (!currentAnnouncement) {
        // Only set to null if we don't already have a fallback announcement
        currentAnnouncement = null;
      }
      updateList();
    });

    let unsubOrders: (() => void) | null = null;
    if (orderNotificationsRef) {
      unsubOrders = onValue(orderNotificationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          currentOrders = Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }));
        } else {
          currentOrders = [];
        }
        updateList();
      });
    }

    return () => {
      unsubAnnouncements();
      if (unsubOrders) unsubOrders();
    };
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case "packaging": return <Package className="w-4 h-4 text-accent-gold" />;
      case "delivering": return <Truck className="w-4 h-4 text-accent-gold" />;
      case "delivered": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "announcement": return <Megaphone className="w-4 h-4 text-accent-gold" />;
      default: return <Bell className="w-4 h-4 text-accent-gold" />;
    }
  };

  return (
    <div className="relative">
      <button
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-foreground/80 hover:text-accent-gold transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 stroke-[1px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-gold rounded-full shadow-[0_0_10px_rgba(192,160,128,0.5)]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 bg-card border border-cardBorder shadow-2xl z-[70] overflow-hidden"
            >
              <div className="px-6 py-6 border-b border-cardBorder flex justify-between items-center">
                <h3 className="font-serif text-lg text-foreground italic">Atelier Alerts</h3>
                <span className="text-[8px] font-bold uppercase tracking-widest text-accent-gold">
                  {unreadCount} NEW
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-6 py-12 text-center opacity-40">
                    <p className="text-[10px] font-bold uppercase tracking-widest italic text-text-muted">Silence in the atelier</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`px-6 py-6 border-b border-cardBorder last:border-0 hover:bg-white/[0.02] transition-colors ${!n.read ? "bg-accent-gold/[0.03]" : ""}`}>
                      <div className="flex gap-4">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-foreground uppercase tracking-tight mb-1">{n.title}</p>
                          <p className="text-[11px] text-text-muted leading-relaxed mb-2 font-medium italic">{n.message}</p>
                          <span className="text-[8px] font-medium text-accent-gold/40 uppercase tracking-tighter">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-background border-t border-cardBorder">
                <Link
                  href={user ? "/profile/orders" : "/login"}
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-3 text-center text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted hover:text-accent-gold transition-colors"
                >
                  {user ? "View Archive" : "Sign In for Updates"}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
