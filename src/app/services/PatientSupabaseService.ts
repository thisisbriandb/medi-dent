import { supabase } from '@/lib/supabase';
import type {
  Patient,
  PatientInsert,
  PatientUpdate,
  PatientFilters,
  ConsultationRow,
  FactureRow,
  OrdonnanceRow,
} from '@/types/patient.types';

// ─── Helpers ───

async function getUserEtablissement(): Promise<string | null> {
  // IMPORTANT: on utilise getSession() (lecture locale) et pas getUser()
  // car getUser() fait un appel réseau qui peut rester pendant
  // à cause du navigator lock lors des navigations rapides.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data } = await supabase
    .from('profils')
    .select('id_etablissement')
    .eq('id', session.user.id)
    .maybeSingle();

  return data?.id_etablissement ?? null;
}

async function generateNumeroDossier(idEtablissement: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAT-${year}-`;

  // On calcule la séquence par établissement.
  const { data, error } = await supabase
    .from('patients')
    .select('numero_dossier')
    .eq('id_etablissement', idEtablissement)
    .ilike('numero_dossier', `${prefix}%`)
    .order('numero_dossier', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `${prefix}0001`;
  }

  // Extraction du numéro de séquence (ex: PAT-2024-0012 -> 12)
  const lastNumero = data[0].numero_dossier;
  const parts = lastNumero.split('-');
  const lastSeqStr = parts[parts.length - 1];
  const lastSeq = parseInt(lastSeqStr, 10);
  
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ─── Service ───

const PatientSupabaseService = {

  // ─── Liste paginée avec filtres ───

  async getAll(filters: PatientFilters = {}): Promise<{ data: Patient[]; total: number }> {
    const idEtab = await getUserEtablissement();
    if (!idEtab) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('id_etablissement', idEtab)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.est_actif !== undefined) {
      query = query.eq('est_actif', filters.est_actif);
    }

    if (filters.sexe) {
      query = query.eq('sexe', filters.sexe);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const s = filters.search.trim();
      query = query.or(
        `nom.ilike.%${s}%,prenom.ilike.%${s}%,telephone.ilike.%${s}%,numero_dossier.ilike.%${s}%,email.ilike.%${s}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur récupération patients:', error.message);
      return { data: [], total: 0 };
    }

    return { data: (data as Patient[]) ?? [], total: count ?? 0 };
  },

  // ─── Détail patient ───

  async getById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération patient:', error.message);
      return null;
    }

    return data as Patient;
  },

  // ─── Création ───

  async create(input: Omit<PatientInsert, 'id_etablissement' | 'numero_dossier'>): Promise<Patient> {
    const idEtab = await getUserEtablissement();
    if (!idEtab) throw new Error('Établissement introuvable.');

    // Tentative de création avec gestion de collision (retry 3 fois)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const numero_dossier = await generateNumeroDossier(idEtab);

      const { data, error } = await supabase
        .from('patients')
        .insert({ ...input, id_etablissement: idEtab, numero_dossier })
        .select('*')
        .single();

      if (!error) {
        return data as Patient;
      }

      // Si erreur de contrainte unique (duplicate key), on réessaye
      if ((error.code === '23505' || error.message?.includes('unique constraint')) && attempts < maxAttempts - 1) {
        attempts++;
        // Petit délai pour laisser passer une autre transaction concurrente
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        continue;
      }

      console.error('Erreur création patient:', error.message);
      throw new Error(error.message);
    }

    throw new Error('Impossible de générer un numéro de dossier unique après plusieurs tentatives.');
  },

  // ─── Mise à jour ───

  async update(id: string, updates: PatientUpdate): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erreur mise à jour patient:', error.message);
      throw new Error(error.message);
    }

    return data as Patient;
  },

  // ─── Activer / Désactiver ───

  async toggleActive(id: string, est_actif: boolean): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .update({ est_actif, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erreur toggle patient:', error.message);
      throw new Error(error.message);
    }
  },

  // ─── Consultations d'un patient ───

  async getConsultations(patientId: string): Promise<ConsultationRow[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select(`
        id,
        date_consultation,
        motif,
        notes_cliniques,
        compte_rendu,
        praticien:profils!id_praticien ( id, nom, prenom )
      `)
      .eq('id_patient', patientId)
      .order('date_consultation', { ascending: false });

    if (error) {
      console.error('Erreur récupération consultations:', error.message);
      return [];
    }

    return (data ?? []) as unknown as ConsultationRow[];
  },

  // ─── Factures d'un patient ───

  async getFactures(patientId: string): Promise<FactureRow[]> {
    const { data, error } = await supabase
      .from('factures')
      .select('id, numero, date_emission, total_ttc, total_paye, reste_a_payer, statut')
      .eq('id_patient', patientId)
      .order('date_emission', { ascending: false });

    if (error) {
      console.error('Erreur récupération factures:', error.message);
      return [];
    }

    return (data ?? []) as FactureRow[];
  },

  // ─── Ordonnances d'un patient ───

  async getOrdonnances(patientId: string): Promise<OrdonnanceRow[]> {
    const { data, error } = await supabase
      .from('ordonnances')
      .select(`
        id,
        created_at,
        notes_patient,
        pdf_url,
        praticien:profils!id_praticien ( id, nom, prenom )
      `)
      .eq('id_patient', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération ordonnances:', error.message);
      return [];
    }

    return (data ?? []) as unknown as OrdonnanceRow[];
  },
};

export default PatientSupabaseService;
