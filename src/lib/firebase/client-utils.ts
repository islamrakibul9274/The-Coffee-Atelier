"use client";

export async function getClientToken(): Promise<string | null> {
  const { auth } = await import('@/lib/firebase/client');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      auth.authStateReady(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Sign-in timed out.')), 8000); }),
    ]);
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch { return null; }
  finally { clearTimeout(timer); }
}
