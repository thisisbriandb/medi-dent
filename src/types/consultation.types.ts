// ─── Types Consultation (basés sur le schéma Supabase) ───

export type CategorieActe = 'consultation' | 'soin' | 'chirurgie' | 'prothese' | 'orthodontie' | 'radiologie' | 'autre';

// ─── Acte (référentiel) ───

export interface Acte {
  id: string;
  id_etablissement: string;
  code: string;
  libelle: string;
  prix_unitaire: number;
  categorie: CategorieActe | null;
  est_actif: boolean;
}

// ─── Consultation ───

export interface Consultation {
  id: string;
  id_etablissement: string;
  id_patient: string;
  id_praticien: string;
  id_rdv: string | null;
  date_consultation: string;
  motif: string | null;
  actes_realises: string | null;
  notes_cliniques: string | null;
  compte_rendu: string | null;
  compte_rendu_ia: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  } | null;
  praticien?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

export interface ConsultationInsert {
  id_patient: string;
  id_praticien: string;
  id_rdv?: string | null;
  date_consultation?: string;
  motif?: string | null;
  actes_realises?: string | null;
  notes_cliniques?: string | null;
  compte_rendu?: string | null;
}

export type ConsultationUpdate = Partial<Omit<ConsultationInsert, 'id_patient'>>;

export interface ConsultationFilters {
  search?: string;
  id_patient?: string;
  id_praticien?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
