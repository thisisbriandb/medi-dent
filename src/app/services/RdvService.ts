import { supabase } from '@/lib/supabase';
import type {
  RendezVous,
  RdvInsert,
  RdvUpdate,
  RdvFilters,
  StatutRdv,
} from '@/types/rdv.types';

// ─── Helpers ───

async function getUserEtablissementAndId(): Promise<{ userId: string; etabId: string } | null> {
  // getSession() = lecture locale non bloquante (cf. nav lock Supabase).
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data } = await supabase
    .from('profils')
    .select('id_etablissement')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!data?.id_etablissement) return null;
  return { userId: session.user.id, etabId: data.id_etablissement };
}

const RDV_SELECT = `
  *,
  patient:patients!id_patient ( id, nom, prenom, numero_dossier, telephone ),
  praticien:profils!id_praticien ( id, nom, prenom )
`;

// ─── Service ───

const RdvService = {

  // ─── Liste paginée ───

  async getAll(filters: RdvFilters = {}): Promise<{ data: RendezVous[]; total: number }> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('rendez_vous')
      .select(RDV_SELECT, { count: 'exact' })
      .eq('id_etablissement', ctx.etabId)
      .order('date_heure', { ascending: true })
      .range(from, to);

    if (filters.date_from) {
      query = query.gte('date_heure', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date_heure', filters.date_to);
    }

    if (filters.id_praticien) {
      query = query.eq('id_praticien', filters.id_praticien);
    }

    if (filters.statut) {
      query = query.eq('statut', filters.statut);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const s = filters.search.trim();
      query = query.or(`motif.ilike.%${s}%,notes_internes.ilike.%${s}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur récupération RDV:', error.message);
      return { data: [], total: 0 };
    }

    return { data: (data ?? []) as unknown as RendezVous[], total: count ?? 0 };
  },

  // ─── RDV par plage de dates (pour le calendrier) ───

  async getByDateRange(dateFrom: string, dateTo: string): Promise<RendezVous[]> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return [];

    const { data, error } = await supabase
      .from('rendez_vous')
      .select(RDV_SELECT)
      .eq('id_etablissement', ctx.etabId)
      .gte('date_heure', dateFrom)
      .lte('date_heure', dateTo)
      .order('date_heure', { ascending: true });

    if (error) {
      console.error('Erreur récupération RDV plage:', error.message);
      return [];
    }

    return (data ?? []) as unknown as RendezVous[];
  },

  // ─── Détail ───

  async getById(id: string): Promise<RendezVous | null> {
    const { data, error } = await supabase
      .from('rendez_vous')
      .select(RDV_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération RDV:', error.message);
      return null;
    }

    return data as unknown as RendezVous;
  },

  // ─── Création ───

  async create(input: RdvInsert): Promise<RendezVous> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) throw new Error('Établissement introuvable.');

    const { data, error } = await supabase
      .from('rendez_vous')
      .insert({
        ...input,
        id_etablissement: ctx.etabId,
        id_praticien: input.id_praticien || ctx.userId,
        duree_minutes: input.duree_minutes || 30,
        statut: input.statut || 'planifie',
      })
      .select(RDV_SELECT)
      .single();

    if (error) {
      console.error('Erreur création RDV:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as RendezVous;
  },

  // ─── Mise à jour ───

  async update(id: string, updates: RdvUpdate): Promise<RendezVous> {
    const { data, error } = await supabase
      .from('rendez_vous')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(RDV_SELECT)
      .single();

    if (error) {
      console.error('Erreur mise à jour RDV:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as RendezVous;
  },

  // ─── Changer statut ───

  async updateStatut(id: string, statut: StatutRdv): Promise<void> {
    const { error } = await supabase
      .from('rendez_vous')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erreur changement statut RDV:', error.message);
      throw new Error(error.message);
    }
  },

  // ─── Supprimer ───

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('rendez_vous')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression RDV:', error.message);
      throw new Error(error.message);
    }
  },

  // ─── Recherche patients (pour le sélecteur) ───

  async searchPatients(query: string): Promise<{ id: string; nom: string; prenom: string; numero_dossier: string; telephone: string | null }[]> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return [];

    const { data, error } = await supabase
      .from('patients')
      .select('id, nom, prenom, numero_dossier, telephone')
      .eq('id_etablissement', ctx.etabId)
      .eq('est_actif', true)
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,numero_dossier.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Erreur recherche patients:', error.message);
      return [];
    }

    return (data ?? []) as { id: string; nom: string; prenom: string; numero_dossier: string; telephone: string | null }[];
  },

  // ─── Praticiens de l'établissement ───

  async getPraticiens(): Promise<{ id: string; nom: string; prenom: string }[]> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return [];

    const { data, error } = await supabase
      .from('profils')
      .select('id, nom, prenom')
      .eq('id_etablissement', ctx.etabId)
      .eq('est_actif', true)
      .in('role', ['praticien', 'medecin_chef', 'admin']);

    if (error) {
      console.error('Erreur récupération praticiens:', error.message);
      return [];
    }

    return (data ?? []) as { id: string; nom: string; prenom: string }[];
  },
};

export default RdvService;
