"use client";

import { Users, ImageIcon, Tags, Megaphone, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const stats = [
  { label: "User Directory", href: "/admin/users", icon: Users },
  { label: "Banners & Media", href: "/admin/banners", icon: ImageIcon },
  { label: "Global Offers", href: "/admin/discounts", icon: Tags },
  { label: "System Alerts", href: "/admin/announcements", icon: Megaphone },
  { label: "Transaction History", href: "/admin/orders", icon: ShoppingBag },
];

export default function AdminDashboard() {
  return (
    <div className="px-8 py-16 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.4em] uppercase mb-4 inline-block">
          Administrative Control
        </span>
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase mb-2">Management Suite</h1>
        <div className="h-px w-12 bg-[#D4AF37] mt-6 mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626] border border-[#262626]">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="bg-[#0A0A0A] p-10 h-full hover:bg-white/[0.02] transition-all group">
                  <div className="w-12 h-12 bg-[#141414] border border-[#262626] flex items-center justify-center mb-8 group-hover:border-[#D4AF37] transition-colors">
                    <Icon className="w-5 h-5 text-[#525252] group-hover:text-[#D4AF37] transition-colors stroke-[1.5px]" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-[10px] font-medium text-[#525252] uppercase tracking-wider">Configure and monitor {item.label.split(' ')[0].toLowerCase()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
