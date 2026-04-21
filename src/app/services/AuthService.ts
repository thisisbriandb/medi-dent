import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ─── Types ───

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'medecin_chef' | 'praticien' | 'infirmier' | 'comptable' | 'stagiaire' | 'secretaire';
  telephone?: string;
  specialite?: string;
  id_etablissement?: string;
}

export interface Profil {
  id: string;
  id_etablissement: string | null;
  role: 'admin' | 'medecin_chef' | 'praticien' | 'infirmier' | 'comptable' | 'stagiaire' | 'secretaire';
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  photo_url: string | null;
  specialite: string | null;
  signature_url: string | null;
  type_personnel: string | null;
  est_actif: boolean;
  etablissement?: {
    id: string;
    nom: string;
    mode_actif: 'cabinet' | 'hopital';
    devise: string;
    taux_tva: number;
    logo_url: string | null;
    theme: 'clair' | 'sombre' | 'auto';
  } | null;
}

// ─── Service ───

const AuthService = {

  // ─── Session ───

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erreur récupération session:', error.message);
      return null;
    }
    return session;
  },

  async getSupabaseUser(): Promise<SupabaseUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Erreur récupération utilisateur Supabase:', error.message);
      return null;
    }
    return user;
  },

  // ─── Profil (table profils) ───

  async getProfil(userId: string): Promise<Profil | null> {
    const { data, error } = await supabase
      .from('profils')
      .select(`
        *,
        etablissement:etablissements (
          id, nom, mode_actif, devise, taux_tva, logo_url, theme
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur récupération profil:', error.message);
      return null;
    }
    return data as Profil;
  },

  async getCurrentProfil(): Promise<Profil | null> {
    const user = await this.getSupabaseUser();
    if (!user) return null;
    return this.getProfil(user.id);
  },

  // ─── Login ───

  async login(credentials: LoginCredentials): Promise<{ profil: Profil }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    const profil = await this.getProfil(data.user.id);
    if (!profil) {
      throw new Error('Profil utilisateur introuvable. Contactez l\'administrateur.');
    }

    // Mise à jour dernière connexion
    await supabase
      .from('profils')
      .update({ derniere_connexion: new Date().toISOString() })
      .eq('id', data.user.id);

    return { profil };
  },

  // ─── Register ───

  async register(data: RegisterData): Promise<{ profil: Profil }> {
    // 1. Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Erreur lors de la création du compte.');
    }

    // 2. Créer le profil dans la table profils
    const { error: profilError } = await supabase
      .from('profils')
      .insert({
        id: authData.user.id,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        email: data.email,
        telephone: data.telephone || null,
        specialite: data.specialite || null,
        id_etablissement: data.id_etablissement || null,
      });

    if (profilError) {
      console.error('Erreur création profil:', profilError.message);
      throw new Error('Compte créé mais le profil n\'a pas pu être enregistré: ' + profilError.message);
    }

    // 3. Récupérer le profil complet
    const profil = await this.getProfil(authData.user.id);
    if (!profil) {
      throw new Error('Profil créé mais introuvable.');
    }

    return { profil };
  },

  // ─── Logout ───

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erreur déconnexion:', error.message);
      throw error;
    }
  },

  // ─── Mise à jour profil ───

  async updateProfil(userId: string, updates: Partial<Profil>): Promise<Profil> {
    const { data, error } = await supabase
      .from('profils')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(`
        *,
        etablissement:etablissements (
          id, nom, mode_actif, devise, taux_tva, logo_url, theme
        )
      `)
      .single();

    if (error) {
      console.error('Erreur mise à jour profil:', error.message);
      throw new Error(error.message);
    }

    return data as Profil;
  },

  // ─── Upload photo de profil ───

  async uploadPhoto(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `profils/${userId}/photo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('medident')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error('Erreur upload photo: ' + uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('medident')
      .getPublicUrl(filePath);

    // Mettre à jour le profil avec l'URL
    await supabase
      .from('profils')
      .update({ photo_url: publicUrl })
      .eq('id', userId);

    return publicUrl;
  },

  // ─── Réinitialisation mot de passe ───

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  },

  // ─── Listener changements d'auth ───

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default AuthService;