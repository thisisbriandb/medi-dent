import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ─── Types ───

export interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = 'admin' | 'medecin_chef' | 'praticien' | 'infirmier' | 'comptable' | 'stagiaire' | 'secretaire';

export interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: UserRole;
  telephone?: string;
  specialite?: string;
  id_etablissement?: string;
}

export interface EtablissementRegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  specialite?: string;
  etablissement: {
    nom: string;
    adresse?: string;
    telephone?: string;
    mode_actif: 'cabinet' | 'hopital';
    devise?: string;
  };
}

export interface InvitationRegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  specialite?: string;
  code_invitation: string;
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
      .maybeSingle();

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

  // ─── Register (legacy) ───

  async register(data: RegisterData): Promise<{ profil: Profil }> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Erreur lors de la création du compte.');

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

    const profil = await this.getProfil(authData.user.id);
    if (!profil) throw new Error('Profil créé mais introuvable.');
    return { profil };
  },

  // ─── Register : Créer un cabinet (onboarding) ───

  async registerWithEtablissement(data: EtablissementRegisterData): Promise<{ profil: Profil }> {
    // 0. Nettoyer toute session résiduelle pour éviter les locks orphelins
    await supabase.auth.signOut().catch(() => {});

    // 1. Auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Erreur lors de la création du compte.');

    if (!authData.session) {
      throw new Error('Cette adresse email est déjà utilisée ou la confirmation email est requise.');
    }

    // 2. Créer l'établissement (UUID généré côté client)
    const etabId = crypto.randomUUID();
    const { error: etabError } = await supabase
      .from('etablissements')
      .insert({
        id: etabId,
        nom: data.etablissement.nom,
        adresse: data.etablissement.adresse || null,
        telephone: data.etablissement.telephone || null,
        mode_actif: data.etablissement.mode_actif,
        devise: data.etablissement.devise || 'XOF',
      });

    if (etabError) {
      throw new Error('Erreur lors de la création de l\'établissement: ' + etabError.message);
    }

    // 3. Créer le profil (medecin_chef)
    const { error: profilError } = await supabase
      .from('profils')
      .insert({
        id: authData.user.id,
        nom: data.nom,
        prenom: data.prenom,
        role: 'medecin_chef' as UserRole,
        email: data.email,
        telephone: data.telephone || null,
        specialite: data.specialite || null,
        id_etablissement: etabId,
      });

    if (profilError) {
      throw new Error('Établissement créé mais le profil n\'a pas pu être enregistré: ' + profilError.message);
    }

    const profil = await this.getProfil(authData.user.id);
    if (!profil) throw new Error('Profil créé mais introuvable.');
    return { profil };
  },

  // ─── Register : Rejoindre via code invitation ───

  async registerWithInvitation(data: InvitationRegisterData): Promise<{ profil: Profil }> {
    // 1. Valider le code
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', data.code_invitation.toUpperCase().trim())
      .eq('utilise', false)
      .maybeSingle();

    if (invError || !invitation) throw new Error('Code d\'invitation invalide.');
    if (new Date(invitation.expire_at) < new Date()) throw new Error('Ce code d\'invitation a expiré.');
    if (invitation.email_invite && invitation.email_invite !== data.email) {
      throw new Error('Ce code est réservé à une autre adresse email.');
    }

    // 2. Nettoyer toute session résiduelle
    await supabase.auth.signOut().catch(() => {});

    // 3. Auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Erreur lors de la création du compte.');
    if (!authData.session) {
      throw new Error('Cette adresse email est déjà utilisée ou la confirmation email est requise.');
    }

    // 4. Créer le profil avec le rôle et l'établissement de l'invitation
    const { error: profilError } = await supabase
      .from('profils')
      .insert({
        id: authData.user.id,
        nom: data.nom,
        prenom: data.prenom,
        role: invitation.role as UserRole,
        email: data.email,
        telephone: data.telephone || null,
        specialite: data.specialite || null,
        id_etablissement: invitation.id_etablissement,
      });

    if (profilError) {
      console.error('Erreur création profil:', profilError.message);
      throw new Error('Compte créé mais le profil n\'a pas pu être enregistré.');
    }

    // 4. Consommer l'invitation
    await supabase
      .from('invitations')
      .update({ utilise: true, id_utilise_par: authData.user.id })
      .eq('id', invitation.id);

    const profil = await this.getProfil(authData.user.id);
    if (!profil) throw new Error('Profil créé mais introuvable.');
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

  // ─── Mise à jour établissement ───

  async updateEtablissement(etabId: string, updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('etablissements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', etabId);

    if (error) {
      console.error('Erreur mise à jour établissement:', error.message);
      throw new Error(error.message);
    }
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