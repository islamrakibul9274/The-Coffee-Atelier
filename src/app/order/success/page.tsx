"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getClientToken } from '@/lib/firebase/client-utils';

function OrderStatus() {
  const sessionId = useSearchParams().get('session_id');
  const { clearCart } = useCartStore();
  const { loading: authLoading, user } = useAuthStore();
  const [status, setStatus] = useState<'verifying' | 'confirmed' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (authLoading) return;
    if (!sessionId || !user) {
      setStatus('error');
      setMessage(!sessionId ? 'No checkout session was provided. You can check existing purchases in your order history.' : 'Please sign in with the account you used at checkout, then return to this page.');
      return;
    }
    const controller = new AbortController();
    setStatus('verifying');
    const verify = async () => {
      try {
        const token = await getClientToken();
        if (!token) throw new Error('Please sign in again to confirm your order.');
        const response = await fetch('/api/orders/verify', { method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sessionId }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Your order could not be confirmed yet.');
        if (!controller.signal.aborted) { clearCart(); setStatus('confirmed'); }
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Please check your order history before trying payment again.');
      }
    };
    verify();
    return () => controller.abort();
  }, [sessionId, authLoading, user, clearCart, attempt]);

  return <div className="min-h-[75svh] flex items-center justify-center px-6 py-16">
    <div className="max-w-lg w-full text-center border border-cardBorder bg-card p-8 sm:p-12" aria-live="polite">
      <div className="w-20 h-20 mx-auto mb-8 border border-accent-gold/30 rounded-full flex items-center justify-center text-accent-gold">
        {status === 'confirmed' ? <CheckCircle className="w-9 h-9" /> : status === 'error' ? <AlertCircle className="w-9 h-9" /> : <Loader2 className="w-9 h-9 animate-spin" />}
      </div>
      <span className="text-[10px] tracking-[0.3em] uppercase text-accent-gold">The Coffee Atelier</span>
      <h1 className="font-serif text-4xl my-5">{status === 'confirmed' ? 'Your next ritual awaits.' : status === 'error' ? 'Let’s check your order.' : 'Confirming your order…'}</h1>
      <p className="text-sm text-text-muted leading-relaxed mb-8">{status === 'confirmed' ? 'Thank you for your purchase. Follow your order’s progress in your account.' : status === 'error' ? message : 'Please keep this page open while we confirm your payment. Your cart will be cleared after confirmation.'}</p>
      {status === 'error' && sessionId && user && <button onClick={() => setAttempt(value => value + 1)} className="block w-full bg-accent-gold text-background py-4 mb-3 font-medium">Try confirmation again</button>}
      {status === 'error' && !user && <Link href="/login" className="block w-full bg-accent-gold text-background py-4 mb-3">Sign in</Link>}
      <Link href="/profile/orders" className="flex justify-center items-center gap-3 border border-accent-gold/30 py-4 text-accent-gold">View my orders <ArrowRight className="w-4 h-4" /></Link>
      <Link href="/#menu-grid" className="inline-block mt-6 text-sm text-text-muted hover:text-foreground">Return to the collection</Link>
    </div>
  </div>;
}

export default function OrderSuccessPage() {
  return <Suspense fallback={<p role="status" className="py-32 text-center text-accent-gold">Loading your order…</p>}><OrderStatus /></Suspense>;
}
