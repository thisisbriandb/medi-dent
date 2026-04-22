// ─── Types Ordonnance (basés sur le schéma Supabase) ───

export interface LigneOrdonnance {
  medicament: string;
  posologie: string;
  duree: string;
  remarques?: string;
}

export interface Ordonnance {
  id: string;
  id_patient: string;
  id_praticien: string;
  id_consultation: string | null;
  lignes: LigneOrdonnance[];
  notes_patient: string | null;
  signature_numerique: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
    date_naissance: string | null;
  } | null;
  praticien?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

export interface OrdonnanceInsert {
  id_patient: string;
  id_praticien?: string;
  id_consultation?: string | null;
  lignes: LigneOrdonnance[];
  notes_patient?: string | null;
}

export type OrdonnanceUpdate = Partial<OrdonnanceInsert>;

export interface OrdonnanceFilters {
  search?: string;
  id_patient?: string;
  id_praticien?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
