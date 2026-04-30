import { supabase } from '@/lib/supabase';

export interface Invitation {
  id: string;
  id_etablissement: string;
  code: string;
  role: string;
  email_invite: string | null;
  utilise: boolean;
  id_utilise_par: string | null;
  expire_at: string;
  created_by: string;
  created_at: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MD-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const InvitationService = {
  // Créer une invitation (admin / medecin_chef)
  async create(params: {
    id_etablissement: string;
    role: string;
    email_invite?: string;
    expire_days?: number;
  }): Promise<Invitation> {
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + (params.expire_days || 7));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        id_etablissement: params.id_etablissement,
        code: generateCode(),
        role: params.role,
        email_invite: params.email_invite || null,
        expire_at: expireAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Invitation;
  },

  // Valider un code (avant inscription — pas besoin d'être authentifié)
  async validate(code: string): Promise<{
    valid: boolean;
    role?: string;
    etablissement_nom?: string;
    id_etablissement?: string;
    email_invite?: string | null;
    error?: string;
  }> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, etablissement:etablissements!id_etablissement(nom)')
      .eq('code', code.toUpperCase().trim())
      .eq('utilise', false)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, error: 'Code d\'invitation invalide.' };
    }

    if (new Date(data.expire_at) < new Date()) {
      return { valid: false, error: 'Ce code d\'invitation a expiré.' };
    }

    return {
      valid: true,
      role: data.role,
      id_etablissement: data.id_etablissement,
      etablissement_nom: (data as any).etablissement?.nom || '',
      email_invite: data.email_invite,
    };
  },

  // Consommer une invitation (après inscription réussie)
  async consume(code: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({ utilise: true, id_utilise_par: userId })
      .eq('code', code.toUpperCase().trim())
      .eq('utilise', false);

    if (error) {
      console.error('Erreur consommation invitation:', error.message);
    }
  },

  // Lister les invitations d'un établissement
  async getByEtablissement(etabId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id_etablissement', etabId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération invitations:', error.message);
      return [];
    }
    return (data ?? []) as Invitation[];
  },

  // Supprimer une invitation non utilisée
  async revoke(id: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)
      .eq('utilise', false);

    if (error) throw new Error(error.message);
  },
};

export default InvitationService;
