"use client";

import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  useEffect(() => {
    let request: AbortController | undefined;
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      request?.abort();
      const current = new AbortController();
      request = current;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        document.cookie = `fbToken=; path=/; max-age=0; SameSite=Strict${secure}`;
        return;
      }
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/auth/sync', { method: 'POST', signal: current.signal,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        if (!response.ok) throw new Error('Profile sync failed.');
        const data = await response.json();
        if (current.signal.aborted) return;
        setUser(data.user);
        document.cookie = `fbToken=${token}; path=/; max-age=3600; SameSite=Strict${secure}`;
      } catch {
        if (current.signal.aborted) return;
        setUser(null);
        document.cookie = `fbToken=; path=/; max-age=0; SameSite=Strict${secure}`;
        toast.error('Your account could not be loaded. Please try signing in again.');
      } finally { if (!current.signal.aborted) setLoading(false); }
    });
    return () => { request?.abort(); unsubscribe(); };
  }, [setUser, setLoading]);
  return <>{children}</>;
}
