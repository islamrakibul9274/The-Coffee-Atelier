"use client";

/**
 * Helper to get the current user's Firebase ID token on the client side.
 * This is strictly a client-side utility and should never import firebase-admin.
 */
export async function getClientToken(): Promise<string | null> {
  const { auth } = await import('@/lib/firebase/client');
  
  // Wait for auth to initialize with a 5-second timeout
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 5000);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        const token = await user.getIdToken();
        resolve(token);
      } else {
        resolve(null);
      }
    });
  });
}
