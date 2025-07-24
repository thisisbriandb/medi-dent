'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService, { 
  LoginCredentials, 
  RegisterPatientData, 
  RegisterMedecinData 
} from '@/app/services/AuthService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginPatient: (credentials: LoginCredentials) => Promise<void>;
  loginMedecin: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  registerPatient: (data: RegisterPatientData) => Promise<void>;
  registerMedecin: (data: RegisterMedecinData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export interface User {
  id: number;
  id_patient?: number;
  id_medecin?: number;
  role: 'patient' | 'medecin' | 'admin';
  email: string;
  nom?: string;
  prenom?: string;
  // Ajoutez d'autres champs selon vos besoins
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      // Vérification côté client uniquement
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        const token = AuthService.getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Échec de la validation de la session", error);
        await AuthService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    router.push('/dashboard');
  };
  
  const loginPatient = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user } = await AuthService.loginPatient(credentials);
      handleLogin(user);
    } catch (error) {
      console.error("Échec de la connexion patient", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginMedecin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user } = await AuthService.loginMedecin(credentials);
      handleLogin(user);
    } catch (error) {
      console.error("Échec de la connexion médecin", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerPatient = async (data: RegisterPatientData) => {
    setIsLoading(true);
    try {
      const { user } = await AuthService.registerPatient(data);
      handleLogin(user);
    } catch (error) {
      console.error("Échec de l'inscription patient", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const registerMedecin = async (data: RegisterMedecinData) => {
    setIsLoading(true);
    try {
      const { user } = await AuthService.registerMedecin(data);
      handleLogin(user);
    } catch (error) {
      console.error("Échec de l'inscription médecin", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error("Échec de la déconnexion", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loginPatient,
    loginMedecin,
    logout,
    registerPatient,
    registerMedecin,
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