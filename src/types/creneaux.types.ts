export interface Creneau {
  id_creneau: number;
  date_creneau: string;
  heure_debut: string;
  heure_fin: string;
  disponible?: boolean; // Rendu optionnel car non présent dans la réponse
  id_medecin: number;
  patient_id?: string;
}

export interface CreateCreneauDTO {
  date_creneau: string
  heure_debut: string
  heure_fin: string
}

export interface CreneauxResponse {
  creneaux: Creneau[]
  date: string
}

export interface CreneauResponse {
  creneau: Creneau
} 