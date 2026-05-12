import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface UserData {
  firebaseUid: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
  loyaltyPoints?: number;
}

interface AuthState {
  user: UserData | null;
  loading: boolean;
  setUser: (user: UserData | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
      // Clear cookies by calling a sign-out route if necessary, 
      // but usually Firebase handles the client-side session.
      // Next.js middleware might need a redirect.
      window.location.href = '/';
    } catch (error) {
      console.error('Logout Error:', error);
    }
  },
}));
