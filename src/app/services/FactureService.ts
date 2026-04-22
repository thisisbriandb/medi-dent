import { supabase } from '@/lib/supabase';
import type {
  Facture,
  FactureInsert,
  FactureUpdate,
  FactureFilters,
  StatutFacture,
} from '@/types/facture.types';

// ─── Helpers ───

async function getUserEtablissement(): Promise<{ userId: string; etabId: string; tauxTva: number } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profils')
    .select('id_etablissement, etablissement:etablissements ( taux_tva )')
    .eq('id', user.id)
    .maybeSingle();

  if (!data?.id_etablissement) return null;
  const tva = (data as any)?.etablissement?.taux_tva ?? 18;
  return { userId: user.id, etabId: data.id_etablissement, tauxTva: tva };
}

async function generateNumeroFacture(idEtablissement: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const { count } = await supabase
    .from('factures')
    .select('id', { count: 'exact', head: true })
    .eq('id_etablissement', idEtablissement)
    .ilike('numero', `${prefix}%`);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

const FACTURE_SELECT = `
  *,
  patient:patients!id_patient ( id, nom, prenom, numero_dossier )
`;

// ─── Service ───

const FactureService = {

  // ─── Liste paginée ───

  async getAll(filters: FactureFilters = {}): Promise<{ data: Facture[]; total: number }> {
    const ctx = await getUserEtablissement();
    if (!ctx) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('factures')
      .select(FACTURE_SELECT, { count: 'exact' })
      .eq('id_etablissement', ctx.etabId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.statut) {
      query = query.eq('statut', filters.statut);
    }

    if (filters.id_patient) {
      query = query.eq('id_patient', filters.id_patient);
    }

    if (filters.date_from) {
      query = query.gte('date_emission', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date_emission', filters.date_to);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const s = filters.search.trim();
      query = query.or(`numero.ilike.%${s}%,notes.ilike.%${s}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur récupération factures:', error.message);
      return { data: [], total: 0 };
    }

    return { data: (data ?? []) as unknown as Facture[], total: count ?? 0 };
  },

  // ─── Détail ───

  async getById(id: string): Promise<Facture | null> {
    const { data, error } = await supabase
      .from('factures')
      .select(FACTURE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération facture:', error.message);
      return null;
    }

    return data as unknown as Facture;
  },

  // ─── Création ───

  async create(input: FactureInsert): Promise<Facture> {
    const ctx = await getUserEtablissement();
    if (!ctx) throw new Error('Établissement introuvable.');

    const numero = await generateNumeroFacture(ctx.etabId);
    const tauxTva = input.taux_tva ?? ctx.tauxTva;
    const totalHt = input.total_ht;
    const montantTva = Math.round(totalHt * tauxTva) / 100;
    const totalTtc = totalHt + montantTva;

    const { data, error } = await supabase
      .from('factures')
      .insert({
        id_etablissement: ctx.etabId,
        id_patient: input.id_patient,
        id_praticien: ctx.userId,
        id_consultation: input.id_consultation || null,
        numero,
        date_emission: input.date_emission || new Date().toISOString().slice(0, 10),
        date_echeance: input.date_echeance || null,
        lignes: input.lignes as any,
        total_ht: totalHt,
        taux_tva: tauxTva,
        montant_tva: montantTva,
        total_ttc: totalTtc,
        total_paye: 0,
        reste_a_payer: totalTtc,
        statut: 'emise',
        notes: input.notes || null,
      })
      .select(FACTURE_SELECT)
      .single();

    if (error) {
      console.error('Erreur création facture:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as Facture;
  },

  // ─── Mise à jour ───

  async update(id: string, updates: FactureUpdate): Promise<Facture> {
    const { data, error } = await supabase
      .from('factures')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(FACTURE_SELECT)
      .single();

    if (error) {
      console.error('Erreur mise à jour facture:', error.message);
      throw new Error(error.message);
    }

    return data as unknown as Facture;
  },

  // ─── Enregistrer un paiement ───

  async enregistrerPaiement(id: string, montant: number): Promise<Facture> {
    const facture = await this.getById(id);
    if (!facture) throw new Error('Facture introuvable.');

    const newTotalPaye = facture.total_paye + montant;
    const newReste = facture.total_ttc - newTotalPaye;
    const newStatut: StatutFacture = newReste <= 0 ? 'payee' : 'partiellement_payee';

    return this.update(id, {
      total_paye: newTotalPaye,
      reste_a_payer: Math.max(newReste, 0),
      statut: newStatut,
    });
  },

  // ─── Stats rapides ───

  async getStats(): Promise<{ totalEmis: number; totalPaye: number; totalImpaye: number; nbFactures: number }> {
    const ctx = await getUserEtablissement();
    if (!ctx) return { totalEmis: 0, totalPaye: 0, totalImpaye: 0, nbFactures: 0 };

    const { data, error } = await supabase
      .from('factures')
      .select('total_ttc, total_paye, reste_a_payer, statut')
      .eq('id_etablissement', ctx.etabId)
      .neq('statut', 'annulee');

    if (error || !data) return { totalEmis: 0, totalPaye: 0, totalImpaye: 0, nbFactures: 0 };

    return {
      totalEmis: data.reduce((s: number, f: { total_ttc: number }) => s + (f.total_ttc || 0), 0),
      totalPaye: data.reduce((s: number, f: { total_paye: number }) => s + (f.total_paye || 0), 0),
      totalImpaye: data.reduce((s: number, f: { reste_a_payer: number }) => s + (f.reste_a_payer || 0), 0),
      nbFactures: data.length,
    };
  },

  // ─── Recherche patients ───

  async searchPatients(query: string): Promise<{ id: string; nom: string; prenom: string; numero_dossier: string }[]> {
    const ctx = await getUserEtablissement();
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

export default FactureService;
