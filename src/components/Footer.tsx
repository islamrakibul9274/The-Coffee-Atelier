"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";


const hiddenPaths = ["/admin", "/manager", "/profile"];

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard pages
  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="bg-background border-t border-cardBorder py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-24">
          <Link href="/" className="flex flex-col items-center group mb-16">
            <span className="font-serif text-3xl md:text-5xl text-foreground tracking-tighter transition-colors duration-700 group-hover:text-accent-gold">
              THE COFFEE ATELIER
            </span>
            <div className="w-16 h-[1px] bg-accent-gold/40 mt-3 transition-all duration-700 group-hover:w-32" />
          </Link>

          <div className="flex flex-wrap justify-center gap-x-8 sm:gap-x-16 gap-y-6 mb-16">
            {[{ name: "The Collection", href: "/#menu-grid" }, { name: "Our Narrative", href: "/#our-story" }, { name: "Questions & Answers", href: "/#questions" }, { name: "Private Membership", href: "/login" }].map((l) => (
              <Link key={l.name} href={l.href} className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted hover:text-accent-gold transition-colors duration-500">
                {l.name}
              </Link>
            ))}
          </div>

        </div>

        <div className="pt-16 border-t border-cardBorder flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-[0.15em] italic">
            &copy; {new Date().getFullYear()} The Coffee Atelier. Artisanal Curations.
          </div>
          <Link href="/#menu-grid" className="text-xs text-accent-gold hover:text-foreground transition-colors">Find your next favorite roast →</Link>
        </div>
      </div>
    </footer>
  );
}
