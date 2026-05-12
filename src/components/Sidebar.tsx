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
  LogOut,
  ChevronRight,
  Heart,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isDashboard = pathname.startsWith("/admin") || 
                      pathname.startsWith("/manager") || 
                      pathname.startsWith("/profile");

  if (!isDashboard || !user) return null;

  const adminLinks = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "User Directory", href: "/admin/users", icon: Users },
    { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Offers", href: "/admin/discounts", icon: Tags },
    { label: "Alerts", href: "/admin/announcements", icon: Megaphone },
    { label: "Global Orders", href: "/admin/orders", icon: ShoppingBag },
  ];

  const managerLinks = [
    { label: "Inventory", href: "/manager/products", icon: Package },
    { label: "Fulfillment", href: "/manager/orders", icon: ShoppingBag },
    { label: "Promotions", href: "/manager/discounts", icon: Tags },
  ];

  const personalLinks = [
    { label: "Personal Profile", href: "/profile", icon: UserIcon },
    { label: "My Orders", href: "/profile/orders", icon: ShoppingBag },
    { label: "My Reviews", href: "/profile/reviews", icon: Megaphone },
  ];

  const managementLinks = user.role === "admin" ? adminLinks : 
                         user.role === "manager" ? managerLinks : [];

  return (
    <aside className="w-72 bg-background border-r border-cardBorder hidden lg:flex flex-col min-h-screen pt-32 px-8 overflow-y-auto custom-scrollbar">
      <div className="mb-12">
        <span className="text-accent-gold text-[9px] font-bold tracking-[0.4em] uppercase mb-3 block italic">
          {user.role} Portal
        </span>
        <h2 className="font-serif text-3xl text-foreground italic">Welcome Back</h2>
      </div>

      {managementLinks.length > 0 && (
        <div className="mb-10">
          <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 border-b border-cardBorder pb-2">Management</p>
          <nav className="space-y-1">
            {managementLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center justify-between py-3 group transition-all duration-300 ${
                    isActive ? "text-accent-gold" : "text-text-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`w-3.5 h-3.5 stroke-[1px] ${isActive ? "text-accent-gold" : "text-text-muted group-hover:text-foreground"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{link.label}</span>
                  </div>
                  <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ${isActive ? "opacity-100 translate-x-0" : "-translate-x-2"}`} />
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <div className="mb-10">
        <p className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4 border-b border-cardBorder pb-2">Personal</p>
        <nav className="space-y-1">
          {personalLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center justify-between py-3 group transition-all duration-300 ${
                  isActive ? "text-accent-gold" : "text-text-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-3.5 h-3.5 stroke-[1px] ${isActive ? "text-accent-gold" : "text-text-muted group-hover:text-foreground"}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{link.label}</span>
                </div>
                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ${isActive ? "opacity-100 translate-x-0" : "-translate-x-2"}`} />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto py-12 border-t border-cardBorder">
        <button 
          onClick={logout}
          className="flex items-center gap-4 text-text-muted hover:text-red-400 transition-colors group w-full"
        >
          <LogOut className="w-4 h-4 stroke-[1px]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Logout</span>
        </button>
      </div>
    </aside>
  );
}
