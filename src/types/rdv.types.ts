// ─── Types Rendez-vous (basés sur le schéma Supabase) ───

export type StatutRdv = 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule' | 'absent';

export interface RendezVous {
  id: string;
  id_etablissement: string;
  id_patient: string;
  id_praticien: string;
  id_salle: string | null;
  date_heure: string;
  duree_minutes: number;
  motif: string | null;
  notes_internes: string | null;
  statut: StatutRdv;
  sms_confirmation_envoye: boolean;
  sms_rappel_j1_envoye: boolean;
  sms_rappel_h2_envoye: boolean;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
    telephone: string | null;
  } | null;
  praticien?: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
}

export interface RdvInsert {
  id_patient: string;
  id_praticien: string;
  id_salle?: string | null;
  date_heure: string;
  duree_minutes?: number;
  motif?: string | null;
  notes_internes?: string | null;
  statut?: StatutRdv;
}

export type RdvUpdate = Partial<RdvInsert>;

export interface RdvFilters {
  date_from?: string;
  date_to?: string;
  id_praticien?: string;
  statut?: StatutRdv;
  search?: string;
  page?: number;
  limit?: number;
}
