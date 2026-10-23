import Link from 'next/link';

export default function NotFound() {
  return <div className="min-h-[70svh] px-6 py-20 flex flex-col items-center justify-center text-center">
    <span className="text-xs tracking-[0.3em] uppercase text-accent-gold">The Coffee Atelier · 404</span>
    <h1 className="font-serif text-5xl sm:text-6xl mt-6 mb-5">A little off the trail.</h1>
    <p className="max-w-md text-sm leading-relaxed text-text-muted mb-8">We couldn’t find that page. There’s still something good waiting in the collection.</p>
    <Link href="/#menu-grid" className="px-8 py-4 bg-accent-gold text-background font-medium text-sm">Explore the collection</Link>
  </div>;
}
