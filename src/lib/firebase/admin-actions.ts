'use server';

import { adminAuth } from '@/lib/firebase/admin';
import { NextRequest } from 'next/server';

/**
 * Verifies the Firebase ID token from an Authorization header.
 * Returns the decoded token payload or null if invalid.
 */
export async function verifyAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}
