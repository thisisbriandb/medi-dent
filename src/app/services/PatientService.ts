import { api } from './api';

// --- Types de Données pour le Patient ---

export interface APIRendezVous {
  id_rdv: number;
  date_rdv: string;
  statut: string;
  id_creneau: number;
  id_patient: number;
  id_compte_rendu: number | null;
  creneau: {
    id_creneau: number;
    date_creneau: string;
    heure_debut: string;
    heure_fin: string;
    id_medecin: number;
    medecin: {
      id_medecin: number;
      nom: string;
      prenom: string;
      specialite: string;
    };
  };
}

// Interface transformée pour l'affichage
export interface RendezVous {
  id: number;
  date_heure: string;
  type: 'visio' | 'presentiel';
  status: 'confirme' | 'en_attente' | 'annule';
  medecin: {
    id: number;
    nom: string;
    prenom: string;
    specialite: string;
  };
}

export interface DossierMedical {
  id: number;
  patient_id: number;
  // ... autres champs du dossier ...
}

export interface Notification {
  id_notification: number;
  contenu: string;
  date_envoie: string;
  lu: boolean;
  id_patient: number;
}

// --- Service Patient ---

class PatientService {

  /**
   * Récupère tous les rendez-vous pour un patient donné.
   * Le tri entre futurs et passés se fera côté client.
   * @param patientId L'ID du patient
   */
  async getRendezVous(): Promise<{ success: boolean; data: APIRendezVous[] }> {
    try {
      const response = await api.get(`/patient/rendezvous`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des rendez-vous pour le patient connecté:`, error);
      return { success: false, data: [] };
    }
  }

  /**
   * Met à jour le statut d'un rendez-vous (par exemple, pour l'annuler).
   * @param rdvId L'ID du rendez-vous
   * @param status Le nouveau statut
   */
  async updateRendezVousStatus(rdvId: number, status: 'confirme' | 'en_attente' | 'annule'): Promise<RendezVous> {
    const response = await api.patch(`/rendezvous/${rdvId}/status`, { status });
    return response.data.data;
  }

  /**
   * Récupère les notifications pour l'utilisateur connecté.
   */
  async getNotifications(): Promise<Notification[]> {
     try {
      const response = await api.get('/notifications');
      return response.data.data || response.data || [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des notifications:`, error);
      return [];
    }
  }

  // ... D'autres méthodes pour le dossier médical, les conversations, etc. seront ajoutées ici ...

}

export const patientService = new PatientService(); 