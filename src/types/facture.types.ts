// ─── Types Facture (basés sur le schéma Supabase) ───

export type StatutFacture = 'brouillon' | 'emise' | 'payee' | 'partiellement_payee' | 'annulee' | 'impayee';

export interface LigneFacture {
  code: string;
  libelle: string;
  quantite: number;
  prix_unitaire: number;
  montant_ht: number;
}

export interface Facture {
  id: string;
  id_etablissement: string;
  id_patient: string;
  id_consultation: string | null;
  numero: string;
  date_emission: string | null;
  date_echeance: string | null;
  lignes: LigneFacture[];
  total_ht: number;
  taux_tva: number;
  montant_tva: number;
  total_ttc: number;
  total_paye: number;
  reste_a_payer: number;
  statut: StatutFacture;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  } | null;
}

export interface FactureInsert {
  id_patient: string;
  id_consultation?: string | null;
  date_emission?: string | null;
  date_echeance?: string | null;
  lignes: LigneFacture[];
  total_ht: number;
  taux_tva?: number;
  montant_tva: number;
  total_ttc: number;
  notes?: string | null;
}

export interface FactureUpdate {
  lignes?: LigneFacture[];
  total_ht?: number;
  taux_tva?: number;
  montant_tva?: number;
  total_ttc?: number;
  total_paye?: number;
  reste_a_payer?: number;
  statut?: StatutFacture;
  notes?: string | null;
  date_echeance?: string | null;
}

export interface FactureFilters {
  search?: string;
  statut?: StatutFacture;
  id_patient?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
