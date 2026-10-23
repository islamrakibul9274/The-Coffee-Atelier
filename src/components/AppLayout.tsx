"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isDashboard = pathname.startsWith("/admin") || 
                      pathname.startsWith("/manager") || 
                      pathname.startsWith("/profile");

  const isHome = pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main-content" className="fixed left-4 top-4 z-[200] -translate-y-24 focus:translate-y-0 bg-accent-gold text-background px-5 py-3 font-medium">Skip to content</a>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className={`min-w-0 flex-1 ${!isHome ? "pt-24 lg:pt-32" : ""} ${isDashboard ? "pb-20 lg:pb-0" : ""}`}>
          {children}
        </main>
      </div>
      {!isDashboard && <Footer />}
      <MobileBottomNav />
    </div>
  );
}

