import create from 'zustand';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (userData: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  login: (userData, token) => set({
    user: userData,
    isAuthenticated: true,
    token
  }),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    token: null
  })
}));