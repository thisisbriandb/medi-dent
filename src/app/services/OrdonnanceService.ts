import { supabase } from '@/lib/supabase';
import type {
  Ordonnance,
  OrdonnanceInsert,
  OrdonnanceUpdate,
  OrdonnanceFilters,
} from '@/types/ordonnance.types';

// ─── Helpers ───

async function getUserInfo(): Promise<{ userId: string; etabId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profils')
    .select('id_etablissement')
    .eq('id', user.id)
    .maybeSingle();

  if (!data?.id_etablissement) return null;
  return { userId: user.id, etabId: data.id_etablissement };
}

const ORDONNANCE_SELECT = `
  *,
  patient:patients!id_patient ( id, nom, prenom, numero_dossier, date_naissance ),
  praticien:profils!id_praticien ( id, nom, prenom )
`;

// ─── Service ───

const OrdonnanceService = {

  // ─── Liste paginée ───

  async getAll(filters: OrdonnanceFilters = {}): Promise<{ data: Ordonnance[]; total: number }> {
    const ctx = await getUserInfo();
    if (!ctx) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Ordonnances liées à des patients de l'établissement
    let query = supabase
      .from('ordonnances')
      .select(ORDONNANCE_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.id_patient) {
      query = query.eq('id_patient', filters.id_patient);
    }

    if (filters.id_praticien) {
      query = query.eq('id_praticien', filters.id_praticien);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const s = filters.search.trim();
      query = query.or(`notes_patient.ilike.%${s}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur récupération ordonnances:', error.message);
      return { data: [], total: 0 };
    }

    return { data: (data ?? []) as unknown as Ordonnance[], total: count ?? 0 };
  },

  // ─── Détail ───

  async getById(id: string): Promise<Ordonnance | null> {
    const { data, error } = await supabase
      .from('ordonnances')
      .select(ORDONNANCE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération ordonnance:', error.message);
      return null;
    }

    return data as unknown as Ordonnance;
  },

  // ─── Création ───

  async create(input: OrdonnanceInsert): Promise<Ordonnance> {
    const ctx = await getUserInfo();
    if (!ctx) throw new Error('Utilisateur non connecté.');

    const { data, error } = await supabase
      .from('ordonnances')
      .insert({
        id_patient: input.id_patient,
        id_praticien: input.id_praticien || ctx.userId,
        id_consultation: input.id_consultation || null,
        lignes: input.lignes as any,
        notes_patient: input.notes_patient || null,
      })
      .select(ORDONNANCE_SELECT)
      .single();

    if (error) {
      console.error('Erreur création ordonnance:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as Ordonnance;
  },

  // ─── Mise à jour ───

  async update(id: string, updates: OrdonnanceUpdate): Promise<Ordonnance> {
    const { data, error } = await supabase
      .from('ordonnances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ORDONNANCE_SELECT)
      .single();

    if (error) {
      console.error('Erreur mise à jour ordonnance:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as Ordonnance;
  },

  // ─── Supprimer ───

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('ordonnances')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression ordonnance:', error.message);
      throw new Error(error.message);
    }
  },

  // ─── Recherche patients ───

  async searchPatients(query: string): Promise<{ id: string; nom: string; prenom: string; numero_dossier: string }[]> {
    const ctx = await getUserInfo();
    if (!ctx) return [];

    const { data, error } = await supabase
      .from('patients')
      .select('id, nom, prenom, numero_dossier')
      .eq('id_etablissement', ctx.etabId)
      .eq('est_actif', true)
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,numero_dossier.ilike.%${query}%`)
      .limit(10);

    if (error) return [];
    return (data ?? []) as { id: string; nom: string; prenom: string; numero_dossier: string }[];
  },
};

export default OrdonnanceService;
