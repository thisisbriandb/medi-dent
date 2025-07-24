import { api } from "./api";

export interface DossierMedical {
  id_dossier: number;
  date_creation: string;
  date_mise_a_jour: string | null;
  groupe_sanguin: string;
  notes_medicales: string | null;
  document_url: string | null;
  id_patient: number;
  poids: number | null;
  taille: number | null;
  allergies: string | null;
  antecedents: string | null;
  traitements: string | null;
  observations: string | null;
}

export interface UpdateDossierMedicalData {
  groupe_sanguin?: string;
  notes_medicales?: string;
  poids?: number;
  taille?: number;
  allergies?: string;
  antecedents?: string;
  traitements?: string;
  observations?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  document_url: string;
}

class MedicalService {
  // Récupérer le dossier médical d'un patient
  async getDossierMedical(patientId: number): Promise<DossierMedical> {
    const response = await api.get(`/patients/${patientId}/dossier-medical`);
    return response.data.data;
  }

  // Ajouter un document au dossier médical
  async addDocument(
    dossierId: number,
    file: File
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("document", file);

        const response = await api.post(
      `/dossiers/${dossierId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  // Supprimer un document
  async removeDocument(dossierId: number, documentId: number): Promise<void> {
        await api.delete(`/dossiers/${dossierId}/documents/${documentId}`);
  }

  async updateDossierMedical(
    dossierId: number,
    data: UpdateDossierMedicalData
  ): Promise<DossierMedical> {
        const response = await api.put(`/dossiers/${dossierId}`, data);
    return response.data.data;
  }

  async createDossierMedical(data: UpdateDossierMedicalData): Promise<DossierMedical> {
        const response = await api.post(`/dossiers`, data);
    return response.data.data;
  }
}

export const medicalService = new MedicalService();