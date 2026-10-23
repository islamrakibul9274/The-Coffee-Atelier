"use client";

import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="min-h-[70svh] px-6 py-20 flex flex-col items-center justify-center text-center">
    <span className="text-xs tracking-[0.3em] uppercase text-accent-gold">The Coffee Atelier</span>
    <h1 className="font-serif text-4xl sm:text-5xl mt-6 mb-5">Let’s take a fresh start.</h1>
    <p className="max-w-md text-sm leading-relaxed text-text-muted mb-8">This page couldn’t be loaded. Please try again. If you were checking out, check your order history before making another payment.</p>
    <button onClick={reset} className="px-8 py-4 bg-accent-gold text-background font-medium text-sm">Try again</button>
    <Link href="/" className="mt-6 text-sm text-text-muted hover:text-foreground">Return to the Atelier</Link>
  </div>;
}
