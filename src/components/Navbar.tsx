"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import CartDrawer from "./CartDrawer";
import SearchModal from "./SearchModal";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { getTotalQuantity } = useCartStore();
  const totalQuantity = getTotalQuantity();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  const isDashboard = pathname.startsWith("/admin") ||
                      pathname.startsWith("/manager") ||
                      pathname.startsWith("/profile");

  useEffect(() => {
    setHasHydrated(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          isDashboard
            ? "bg-background border-b border-cardBorder py-4"
            : isScrolled ? "glass-nav py-4" : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Left: Nav Links */}
          <div className="hidden lg:flex items-center gap-10">
            <Link
              href="/#menu-grid"
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/80 hover:text-accent-gold transition-colors"
            >
              Collection
            </Link>
            <Link href="/#our-story" className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/80 hover:text-accent-gold transition-colors">
              Our Story
            </Link>
          </div>

          {/* Center: Branding */}
          <Link href="/" className="flex flex-col items-center group">
            <span className="font-serif text-2xl md:text-3xl text-foreground tracking-tighter group-hover:text-accent-gold transition-colors duration-700">
              THE COFFEE ATELIER
            </span>
            <div className="w-12 h-[1px] bg-accent-gold/40 mt-1 transition-all duration-700 group-hover:w-24" />
          </Link>

          {/* Right: Icons */}
          <div className="flex items-center gap-2 md:gap-5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-foreground/80 hover:text-accent-gold transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1px]" />
            </button>

            <NotificationsDropdown />

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground/80 hover:text-accent-gold transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1px]" />
              {hasHydrated && totalQuantity > 0 && (
                <span className="absolute top-1 right-1 bg-accent-gold text-background text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </button>

            {user ? (
              <Link href="/profile" className="flex items-center">
                {user.profileImage ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-accent-gold/30 hover:border-accent-gold transition-colors">
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="p-2 text-foreground/80 hover:text-accent-gold transition-colors">
                    <User className="w-5 h-5 stroke-[1px]" />
                  </div>
                )}
              </Link>
            ) : (
              <Link href="/login" className="hidden md:block text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/80 hover:text-accent-gold transition-colors ml-2">
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-foreground/80 hover:text-accent-gold transition-colors"
            >
              <Menu className="w-6 h-6 stroke-[1px]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-16">
              <span className="font-serif text-2xl text-foreground">THE COFFEE ATELIER</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-foreground">
                <X className="w-8 h-8 stroke-[1px]" />
              </button>
            </div>
            <div className="flex flex-col gap-10 text-center">
              <Link
                href="/#menu-grid"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-serif text-4xl text-foreground hover:text-accent-gold italic"
              >
                The Collection
              </Link>
              <Link 
                href="/#our-story" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-serif text-4xl text-foreground hover:text-accent-gold italic"
              >
                Our Narrative
              </Link>
              <Link href="/profile" className="font-serif text-4xl text-foreground hover:text-accent-gold italic">
                Member Profile
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
