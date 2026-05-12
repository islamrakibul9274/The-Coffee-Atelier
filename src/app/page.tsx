import HeroSection from "@/components/landing/HeroSection";
import OurStory from "@/components/landing/OurStory";
import FlashDiscounts from "@/components/landing/FlashDiscounts";
import MenuSection from "@/components/landing/MenuSection";
import FAQSection from "@/components/landing/FAQSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Our Story Section (The Coffee Atelier narrative) */}
      <OurStory />

      {/* 3. Flash Discounts with countdown timers */}
      <FlashDiscounts />

      {/* 4. Dynamic Coffee Menu Grid */}
      <MenuSection />

      {/* 5. FAQ Accordion */}
      <FAQSection />
    </div>
  );
}
