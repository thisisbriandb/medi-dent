import { supabase, getValidSession } from '@/lib/supabase';
import type {
  Consultation,
  ConsultationInsert,
  ConsultationUpdate,
  ConsultationFilters,
  Acte,
} from '@/types/consultation.types';

// ─── Helpers ───

async function getUserEtablissementAndId(): Promise<{ userId: string; etabId: string } | null> {
  const session = await getValidSession();
  if (!session?.user) return null;

  const { data } = await supabase
    .from('profils')
    .select('id_etablissement')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!data?.id_etablissement) return null;
  return { userId: session.user.id, etabId: data.id_etablissement };
}

// ─── Select fragment for consultations with joins ───

const CONSULTATION_SELECT = `
  *,
  patient:patients!id_patient ( id, nom, prenom, numero_dossier ),
  praticien:profils!id_praticien ( id, nom, prenom )
`;

// ─── Service ───

const ConsultationService = {

  // ─── Liste paginée ───

  async getAll(filters: ConsultationFilters = {}): Promise<{ data: Consultation[]; total: number }> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('consultations')
      .select(CONSULTATION_SELECT, { count: 'exact' })
      .eq('id_etablissement', ctx.etabId)
      .order('date_consultation', { ascending: false })
      .range(from, to);

    if (filters.id_patient) {
      query = query.eq('id_patient', filters.id_patient);
    }

    if (filters.id_praticien) {
      query = query.eq('id_praticien', filters.id_praticien);
    }

    if (filters.date_from) {
      query = query.gte('date_consultation', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date_consultation', filters.date_to);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const s = filters.search.trim();
      query = query.or(`motif.ilike.%${s}%,notes_cliniques.ilike.%${s}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur récupération consultations:', error.message);
      return { data: [], total: 0 };
    }

    return { data: (data ?? []) as unknown as Consultation[], total: count ?? 0 };
  },

  // ─── Détail ───

  async getById(id: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select(CONSULTATION_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération consultation:', error.message);
      return null;
    }

    return data as unknown as Consultation;
  },

  // ─── Création ───

  async create(input: ConsultationInsert): Promise<Consultation> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) throw new Error('Établissement introuvable.');

    const { data, error } = await supabase
      .from('consultations')
      .insert({
        ...input,
        id_etablissement: ctx.etabId,
        id_praticien: input.id_praticien || ctx.userId,
        date_consultation: input.date_consultation || new Date().toISOString(),
      })
      .select(CONSULTATION_SELECT)
      .single();

    if (error) {
      console.error('Erreur création consultation:', error.message);
      throw new Error(error.message);
    }

    // Mettre à jour la dernière visite du patient
    await supabase
      .from('patients')
      .update({ derniere_visite: new Date().toISOString() })
      .eq('id', input.id_patient);

    return data as unknown as Consultation;
  },

  // ─── Mise à jour ───

  async update(id: string, updates: ConsultationUpdate): Promise<Consultation> {
    const { data, error } = await supabase
      .from('consultations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(CONSULTATION_SELECT)
      .single();

    if (error) {
      console.error('Erreur mise à jour consultation:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as Consultation;
  },

  // ─── Supprimer ───

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression consultation:', error.message);
      throw new Error(error.message);
    }
  },

  // ─── Actes (référentiel) ───

  async getActes(): Promise<Acte[]> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return [];

    const { data, error } = await supabase
      .from('actes')
      .select('*')
      .eq('id_etablissement', ctx.etabId)
      .eq('est_actif', true)
      .order('categorie')
      .order('libelle');

    if (error) {
      console.error('Erreur récupération actes:', error.message);
      return [];
    }

    return (data ?? []) as Acte[];
  },

  // ─── Patients (pour le sélecteur) ───

  async searchPatients(query: string): Promise<{ id: string; nom: string; prenom: string; numero_dossier: string }[]> {
    const ctx = await getUserEtablissementAndId();
    if (!ctx) return [];

    const { data, error } = await supabase
      .from('patients')
      .select('id, nom, prenom, numero_dossier')
      .eq('id_etablissement', ctx.etabId)
      .eq('est_actif', true)
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,numero_dossier.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Erreur recherche patients:', error.message);
      return [];
    }

    return (data ?? []) as { id: string; nom: string; prenom: string; numero_dossier: string }[];
  },
};

export default ConsultationService;
