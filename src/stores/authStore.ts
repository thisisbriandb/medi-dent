import { create } from 'zustand';
import AuthService, {
  LoginCredentials,
  RegisterData,
  EtablissementRegisterData,
  InvitationRegisterData,
  Profil
} from '@/app/services/AuthService';

interface AuthState {
  profil: Profil | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  modeActif: 'cabinet' | 'hopital';
  
  // Actions
  login: (credentials: LoginCredentials, router?: any) => Promise<void>;
  register: (data: RegisterData, router?: any) => Promise<void>;
  registerWithEtablissement: (data: EtablissementRegisterData, router?: any) => Promise<void>;
  registerWithInvitation: (data: InvitationRegisterData, router?: any) => Promise<void>;
  logout: (router?: any) => Promise<void>;
  refreshProfil: () => Promise<void>;
  
  // Internal/Init
  setProfil: (profil: Profil | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

// Variable globale pour éviter les événements concurrents
let skipNextAuthEvent = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  profil: null,
  isAuthenticated: false,
  isLoading: true,
  modeActif: 'cabinet',

  setProfil: (profil) => set({ 
    profil, 
    modeActif: profil?.etablissement?.mode_actif ?? 'cabinet' 
  }),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  login: async (credentials, router) => {
    set({ isLoading: true });
    try {
      skipNextAuthEvent = true;
      const { profil: p } = await AuthService.login(credentials);
      set((state) => ({ 
        profil: p, 
        isAuthenticated: true,
        modeActif: p?.etablissement?.mode_actif ?? 'cabinet',
      }));
      window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent = false;
      console.error('Login error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data, router) => {
    set({ isLoading: true });
    try {
      skipNextAuthEvent = true;
      const { profil: p } = await AuthService.register(data);
      set((state) => ({ 
        profil: p, 
        isAuthenticated: true,
        modeActif: p?.etablissement?.mode_actif ?? 'cabinet',
      }));
      if (router) router.push('/dashboard');
      else window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent = false;
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerWithEtablissement: async (data, router) => {
    set({ isLoading: true });
    try {
      skipNextAuthEvent = true;
      const { profil: p } = await AuthService.registerWithEtablissement(data);
      set((state) => ({ 
        profil: p, 
        isAuthenticated: true,
        modeActif: p?.etablissement?.mode_actif ?? 'cabinet',
      }));
      if (router) router.push('/dashboard');
      else window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent = false;
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerWithInvitation: async (data, router) => {
    set({ isLoading: true });
    try {
      skipNextAuthEvent = true;
      const { profil: p } = await AuthService.registerWithInvitation(data);
      set((state) => ({ 
        profil: p, 
        isAuthenticated: true,
        modeActif: p?.etablissement?.mode_actif ?? 'cabinet',
      }));
      if (router) router.push('/dashboard');
      else window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent = false;
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async (router) => {
    set({ isLoading: true });
    try {
      skipNextAuthEvent = true;
      await AuthService.logout();
      set({ profil: null, isAuthenticated: false });
      window.location.href = '/login';
    } catch (error) {
      skipNextAuthEvent = false;
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProfil: async () => {
    const { profil } = get();
    if (!profil?.id) return;
    const updated = await AuthService.getProfil(profil.id);
    if (updated) {
      set({ 
        profil: updated,
        modeActif: updated?.etablissement?.mode_actif ?? 'cabinet'
      });
    }
  }
}));

// Initialisation globale
if (typeof window !== 'undefined') {
  // 1. Initialiser la session via getSession() (lecture locale, rapide)
  // Le proxy côté serveur a déjà validé/rafraîchi le token.
  const initTimeout = setTimeout(() => {
    console.warn('[AuthStore] Init timeout — forcing isLoading=false');
    useAuthStore.getState().setIsLoading(false);
  }, 4000);

  AuthService.getSession().then(async (session) => {
    clearTimeout(initTimeout);
    if (session?.user) {
      try {
        const currentProfil = await AuthService.getProfil(session.user.id);
        if (currentProfil) {
          useAuthStore.getState().setProfil(currentProfil);
          useAuthStore.getState().setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('[AuthStore] Erreur getProfil init:', e);
      }
    }
    useAuthStore.getState().setIsLoading(false);
  }).catch((error) => {
    clearTimeout(initTimeout);
    console.error('[AuthStore] Erreur initialisation session:', error);
    useAuthStore.getState().setIsLoading(false);
  });

  // 2. Écouter les changements d'auth
  AuthService.onAuthStateChange(async (event, session) => {
    if (skipNextAuthEvent) {
      skipNextAuthEvent = false;
      return;
    }

    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().setProfil(null);
      useAuthStore.getState().setIsAuthenticated(false);
    } else if (event === 'SIGNED_IN' && session?.user) {
      try {
        const p = await AuthService.getProfil(session.user.id);
        if (p) {
          useAuthStore.getState().setProfil(p);
          useAuthStore.getState().setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('[AuthStore] Erreur getProfil onAuthStateChange:', e);
      }
    }
  });
}

