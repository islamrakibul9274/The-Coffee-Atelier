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
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className={`flex-1 ${!isHome ? "pt-24 lg:pt-32" : ""} ${isDashboard ? "pb-20 lg:pb-0" : ""}`}>
          {children}
        </main>
      </div>
      {!isDashboard && <Footer />}
      <MobileBottomNav />
    </div>
  );
}

