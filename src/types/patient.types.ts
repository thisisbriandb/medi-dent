// ─── Types Patient (basés sur le schéma Supabase) ───

export type Sexe = 'M' | 'F';

export type StatutFacture = 'brouillon' | 'emise' | 'payee' | 'partiellement_payee' | 'annulee' | 'impayee';

export type StatutRdv = 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule' | 'absent';

export type CategorieActe = 'consultation' | 'soin' | 'chirurgie' | 'prothese' | 'orthodontie' | 'radiologie' | 'autre';

// ─── Patient ───

export interface Patient {
  id: string;
  id_etablissement: string;
  numero_dossier: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  sexe: Sexe | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  profession: string | null;
  groupe_sanguin: string | null;
  allergies: string | null;
  antecedents: string | null;
  traitements_en_cours: string | null;
  contact_urgence_nom: string | null;
  contact_urgence_telephone: string | null;
  contact_urgence_lien: string | null;
  est_actif: boolean;
  derniere_visite: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientInsert {
  id_etablissement: string;
  numero_dossier: string;
  nom: string;
  prenom: string;
  date_naissance?: string | null;
  sexe?: Sexe | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  profession?: string | null;
  groupe_sanguin?: string | null;
  allergies?: string | null;
  antecedents?: string | null;
  traitements_en_cours?: string | null;
  contact_urgence_nom?: string | null;
  contact_urgence_telephone?: string | null;
  contact_urgence_lien?: string | null;
}

export type PatientUpdate = Partial<Omit<PatientInsert, 'id_etablissement' | 'numero_dossier'>>;

export interface PatientFilters {
  search?: string;
  est_actif?: boolean;
  sexe?: Sexe;
  page?: number;
  limit?: number;
}

// ─── Consultation (version légère pour les listes) ───

export interface ConsultationRow {
  id: string;
  date_consultation: string;
  motif: string | null;
  notes_cliniques: string | null;
  compte_rendu: string | null;
  praticien?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

// ─── Facture (version légère pour les listes) ───

export interface FactureRow {
  id: string;
  numero: string;
  date_emission: string | null;
  total_ttc: number;
  total_paye: number;
  reste_a_payer: number;
  statut: StatutFacture;
}

// ─── Ordonnance (version légère pour les listes) ───

export interface OrdonnanceRow {
  id: string;
  created_at: string;
  notes_patient: string | null;
  pdf_url: string | null;
  praticien?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}
