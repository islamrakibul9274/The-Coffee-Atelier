"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  ImageIcon,
  Tags,
  Megaphone,
  User as UserIcon,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isDashboard =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/profile");

  if (!isDashboard || !user) return null;

  const adminLinks = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Offers", href: "/admin/discounts", icon: Tags },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  ];

  const managerLinks = [
    { label: "Products", href: "/manager/products", icon: Package },
    { label: "Orders", href: "/manager/orders", icon: ShoppingBag },
    { label: "Promos", href: "/manager/discounts", icon: Tags },
  ];

  const personalLinks = [
    { label: "Profile", href: "/profile", icon: UserIcon },
    { label: "Orders", href: "/profile/orders", icon: ShoppingBag },
    { label: "Reviews", href: "/profile/reviews", icon: Megaphone },
  ];

  const managementLinks =
    user.role === "admin"
      ? adminLinks
      : user.role === "manager"
      ? managerLinks
      : [];

  const links = [...managementLinks, ...personalLinks];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-cardBorder lg:hidden">
      <div className="flex items-center justify-around px-1 py-2 overflow-x-auto no-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 min-w-[56px] rounded-lg transition-colors ${
                isActive
                  ? "text-accent-gold"
                  : "text-text-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`w-4 h-4 stroke-[1.5px] ${
                  isActive ? "text-accent-gold" : ""
                }`}
              />
              <span className="text-[8px] font-bold uppercase tracking-wider leading-none">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
