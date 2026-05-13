'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import AuthService, { 
  LoginCredentials, 
  RegisterData,
  EtablissementRegisterData,
  InvitationRegisterData,
  Profil 
} from '@/app/services/AuthService';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  profil: Profil | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  modeActif: 'cabinet' | 'hopital';
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerWithEtablissement: (data: EtablissementRegisterData) => Promise<void>;
  registerWithInvitation: (data: InvitationRegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Ref pour éviter que le listener onAuthStateChange fasse des appels
  // concurrents quand login()/register() gèrent déjà le profil.
  const skipNextAuthEvent = useRef(false);

  // Mode actif dérivé de l'établissement
  const modeActif = profil?.etablissement?.mode_actif ?? 'cabinet';

  // ─── Initialisation : écouter les changements d'auth Supabase ───
  useEffect(() => {
    let mounted = true;

    // 1. Charger le profil si une session existe déjà
    const initSession = async () => {
      try {
        const session = await AuthService.getSession();
        if (session?.user && mounted) {
          const currentProfil = await AuthService.getProfil(session.user.id);
          if (currentProfil && mounted) {
            setProfil(currentProfil);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Erreur initialisation session:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    // 2. Écouter les changements d'état auth (tab sync, token refresh, sign out externe)
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Si login()/register() a déjà géré cet événement, on skip
        if (skipNextAuthEvent.current) {
          skipNextAuthEvent.current = false;
          return;
        }

        if (event === 'SIGNED_OUT') {
          setProfil(null);
          setIsAuthenticated(false);
          // Redirection fiable vers login
          window.location.href = '/login';
          return;
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Pas besoin de re-fetch le profil lors du refresh token
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Événement venant d'un autre onglet ou au refresh
          // Ne fetch que si on n'a pas déjà un profil
          if (!profil) {
            try {
              const p = await AuthService.getProfil(session.user.id);
              if (p && mounted) {
                setProfil(p);
                setIsAuthenticated(true);
              }
            } catch (error) {
              console.error('Erreur récupération profil (listener):', error);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Refresh proactif de la session ───
  // Quand l'onglet redevient visible après une période d'inactivité,
  // on force un refresh du token pour éviter les requêtes avec un JWT expiré.
  useEffect(() => {
    let lastHidden = 0;

    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        lastHidden = Date.now();
        return;
      }
      // Ne rafraîchir que si l'onglet était caché > 30s et qu'on est authentifié
      if (!isAuthenticated || Date.now() - lastHidden < 30_000) return;

      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Session expirée, redirection login:', error.message);
          setProfil(null);
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      } catch {
        // Erreur réseau, on ignore
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated]);

  // Quand le pathname change (navigation sidebar), on tente un refresh
  // léger pour s'assurer que le token est frais avant les appels data.
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshIfNeeded = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setProfil(null);
          setIsAuthenticated(false);
          window.location.href = '/login';
          return;
        }
        // Si le token expire dans moins de 60s, forcer un refresh
        const expiresAt = session.expires_at ?? 0;
        if (expiresAt * 1000 - Date.now() < 60_000) {
          await supabase.auth.refreshSession();
        }
      } catch {
        // Erreur réseau, les appels data gèreront l'erreur
      }
    };

    refreshIfNeeded();
  }, [pathname, isAuthenticated]);

  // ─── Actions ───

  const login = async (credentials: LoginCredentials) => {
    console.log('[DEBUG] AuthContext.login() START');
    setIsLoading(true);
    try {
      console.log('[DEBUG] AuthContext.login() - calling AuthService.login...');
      // Signal au listener de ne pas refaire un getProfil concurrent
      skipNextAuthEvent.current = true;
      const { profil: p } = await AuthService.login(credentials);
      console.log('[DEBUG] AuthContext.login() - success, profil:', !!p);
      setProfil(p);
      setIsAuthenticated(true);
      console.log('[DEBUG] AuthContext.login() - Redirecting to /dashboard');
      window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error('[DEBUG] AuthContext.login() - CATCH ERROR:', error);
      throw error;
    } finally {
      console.log('[DEBUG] AuthContext.login() - FINALLY executed');
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      skipNextAuthEvent.current = true;
      const { profil: p } = await AuthService.register(data);
      setProfil(p);
      setIsAuthenticated(true);
      window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error("Échec de l'inscription", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEtablissement = async (data: EtablissementRegisterData) => {
    setIsLoading(true);
    try {
      skipNextAuthEvent.current = true;
      const { profil: p } = await AuthService.registerWithEtablissement(data);
      setProfil(p);
      setIsAuthenticated(true);
      window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error("Échec de l'inscription établissement", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithInvitation = async (data: InvitationRegisterData) => {
    setIsLoading(true);
    try {
      skipNextAuthEvent.current = true;
      const { profil: p } = await AuthService.registerWithInvitation(data);
      setProfil(p);
      setIsAuthenticated(true);
      window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error("Échec de l'inscription par invitation", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      skipNextAuthEvent.current = true;
      await AuthService.logout();
      setProfil(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error('Erreur déconnexion:', error);
    }
  };

  const refreshProfil = useCallback(async () => {
    if (!profil?.id) return;
    const updated = await AuthService.getProfil(profil.id);
    if (updated) setProfil(updated);
  }, [profil?.id]);

  const value = {
    profil,
    isAuthenticated,
    isLoading,
    modeActif,
    login,
    register,
    registerWithEtablissement,
    registerWithInvitation,
    logout,
    refreshProfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
};