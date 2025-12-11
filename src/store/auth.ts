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
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (token: string) => void;
  setUser: (user: UserData) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      login: (token: string) => set({ token, isAuthenticated: true }),
      setUser: (user: UserData) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
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
