'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import AuthService, { 
  LoginCredentials, 
  RegisterData,
  EtablissementRegisterData,
  InvitationRegisterData,
  Profil 
} from '@/app/services/AuthService';
import { useRouter } from 'next/navigation';

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

  // ─── Actions ───

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Signal au listener de ne pas refaire un getProfil concurrent
      skipNextAuthEvent.current = true;
      const { profil: p } = await AuthService.login(credentials);
      setProfil(p);
      setIsAuthenticated(true);
      window.location.href = '/dashboard';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error('Échec de la connexion', error);
      throw error;
    } finally {
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
    setIsLoading(true);
    try {
      skipNextAuthEvent.current = true;
      await AuthService.logout();
      setProfil(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch (error) {
      skipNextAuthEvent.current = false;
      console.error('Échec de la déconnexion', error);
      throw error;
    } finally {
      setIsLoading(false);
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