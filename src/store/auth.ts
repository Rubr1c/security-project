import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/lib/db/types';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  doctorId: number | null;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: UserData) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuthenticated: (authenticated: boolean) =>
        set({ isAuthenticated: authenticated }),
      setUser: (user: UserData) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
