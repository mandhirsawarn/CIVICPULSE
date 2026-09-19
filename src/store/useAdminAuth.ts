import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Demo-mode admin credential. This is a mock gate for the SIH demo only —
// there is no real backend auth here, just a believable, persistent
// "logged in" state so the command center feels access-controlled.
const DEMO_ADMIN_PASSWORD = 'civicpulse2026';

interface AdminAuthState {
  isAuthenticated: boolean;
  adminName: string;
  lastLoginAt: string | null;
  login: (password: string) => { success: boolean; error?: string };
  logout: () => void;
  setAuthenticated: (status: boolean) => void;
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      adminName: 'GovOps Admin',
      lastLoginAt: null,

      login: (password: string) => {
        if (password.trim() === DEMO_ADMIN_PASSWORD) {
          set({ isAuthenticated: true, lastLoginAt: new Date().toISOString() });
          return { success: true };
        }
        return { success: false, error: 'Incorrect access code. Please try again.' };
      },

      logout: () => set({ isAuthenticated: false }),
      setAuthenticated: (status: boolean) => set({ isAuthenticated: status }),
    }),
    {
      name: 'civicpulse-admin-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const ADMIN_DEMO_PASSWORD_HINT = DEMO_ADMIN_PASSWORD;
