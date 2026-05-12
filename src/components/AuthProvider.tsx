"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          
          // Sync with our backend
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (!response.ok) {
            throw new Error('Failed to sync user with database');
          }

          const data = await response.json();
          setUser(data.user);
          
          // Set cookie for middleware access (optional but useful for Edge)
          document.cookie = `fbToken=${token}; path=/; max-age=3600; SameSite=Strict`;
        } catch (error: any) {
          console.error("Auth error:", error);
          toast.error("Failed to authenticate user data.");
          setUser(null);
        }
      } else {
        setUser(null);
        document.cookie = `fbToken=; path=/; max-age=0; SameSite=Strict`;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
