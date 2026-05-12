"use client";

import { Package, ShoppingBag, Tags } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  { label: "Product Inventory", href: "/manager/products", icon: Package, desc: "Add, edit & manage coffee blends" },
  { label: "Order Fulfillment", href: "/manager/orders", icon: ShoppingBag, desc: "Update delivery statuses" },
  { label: "Local Promotions", href: "/manager/discounts", icon: Tags, desc: "Manage store offers" },
];

export default function ManagerDashboard() {
  return (
    <div className="px-8 py-16 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.4em] uppercase mb-4 inline-block">
          Operations Hub
        </span>
        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase mb-2">Manager Console</h1>
        <div className="h-px w-12 bg-[#D4AF37] mt-6 mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626] border border-[#262626]">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.label} href={c.href}>
                <div className="bg-[#0A0A0A] p-10 h-full hover:bg-white/[0.02] transition-all group">
                  <div className="w-12 h-12 bg-[#141414] border border-[#262626] flex items-center justify-center mb-8 group-hover:border-[#D4AF37] transition-colors">
                    <Icon className="w-5 h-5 text-[#525252] group-hover:text-[#D4AF37] transition-colors stroke-[1.5px]" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {c.label}
                  </h3>
                  <p className="text-[10px] font-medium text-[#525252] uppercase tracking-wider">{c.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
